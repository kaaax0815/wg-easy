import type { H3Event, SessionData } from 'h3';
import type { UserType } from '#db/repositories/user/types';
import type { SessionConfig } from '#db/repositories/general/types';

export type WGSession = Partial<{
  userId: ID;
  rememberMe: boolean;
  pendingLogin: {
    type: 'password' | 'oauth';
    userId: ID;
    /** in milliseconds */
    expiresAt: number;
  };
  oauth_verifier: string;
  oauth_nonce: string;
  oauth_state: string;
  /** in milliseconds */
  expiresAt: number;
}>;

const name = 'wg-easy';
const SHORT_SESSION_TIMEOUT = 15 * 60;

function getSessionConfig(sessionConfig: SessionConfig, rememberMe = false) {
  return {
    password: sessionConfig.sessionPassword,
    name,
    cookie: {
      secure: !WG_ENV.INSECURE,
      expires: undefined,
      // expiration is handled by code
      maxAge: rememberMe ? sessionConfig.sessionTimeout : undefined,
    },
  };
}

/**
 * @returns in seconds
 */
function getMaxAge(rememberMe: boolean, sessionTimeout: number) {
  return rememberMe
    ? sessionTimeout
    : Math.min(sessionTimeout, SHORT_SESSION_TIMEOUT);
}

function getSessionExpiresAt(rememberMe: boolean, sessionTimeout: number) {
  return Date.now() + getMaxAge(rememberMe, sessionTimeout) * 1000;
}

function checkSessionExpiration(session: { data: SessionData<WGSession> }) {
  if (!session.data.expiresAt) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid session',
    });
  }

  if (new Date() > new Date(session.data.expiresAt)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Session expired',
    });
  }
}

/**
 * Don't use `session.update()` for setting `rememberMe`, use {@link updateWGSession}
 */
export async function useWGSession(event: H3Event) {
  const sessionConfig = await Database.general.getSessionConfig();

  let session = await useSession<WGSession>(
    event,
    getSessionConfig(sessionConfig)
  );

  if (!session.data.expiresAt) {
    session = await session.update({
      expiresAt: getSessionExpiresAt(
        session.data.rememberMe ?? false,
        sessionConfig.sessionTimeout
      ),
    });
  }

  checkSessionExpiration(session);

  return session;
}

export async function getWGSession(event: H3Event) {
  const sessionConfig = await Database.general.getSessionConfig();

  let session = await getSession<WGSession>(
    event,
    getSessionConfig(sessionConfig)
  );

  if (!session.data.expiresAt) {
    session = await updateSession<WGSession>(
      event,
      getSessionConfig(sessionConfig, session.data.rememberMe ?? false),
      {
        expiresAt: getSessionExpiresAt(
          session.data.rememberMe ?? false,
          sessionConfig.sessionTimeout
        ),
      }
    );
  }

  checkSessionExpiration(session);

  return session;
}

// Types copied from h3 source code (removed update being a fn)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionDataT = Record<string, any>;
type SessionUpdate<T extends SessionDataT = SessionDataT> = Partial<
  SessionData<T>
>;

export async function updateWGSession(
  event: H3Event,
  update?: SessionUpdate<WGSession>
) {
  const sessionConfig = await Database.general.getSessionConfig();
  const currentSession = await getSession<WGSession>(
    event,
    getSessionConfig(sessionConfig)
  );
  const rememberMe =
    update?.rememberMe ?? currentSession.data.rememberMe ?? false;

  if (currentSession.data.expiresAt) {
    checkSessionExpiration(currentSession);
  }

  const sessionUpdate: SessionUpdate<WGSession> = {
    ...(update ?? {}),
    expiresAt: getSessionExpiresAt(rememberMe, sessionConfig.sessionTimeout),
  };

  const session = await updateSession<WGSession>(
    event,
    getSessionConfig(sessionConfig, rememberMe),
    sessionUpdate
  );

  checkSessionExpiration(session);

  return session;
}

async function getBasicAuthUser(authorization: string) {
  if (WG_ENV.DISABLE_PASSWORD_AUTH) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Password authentication is disabled',
    });
  }

  const [method, value] = authorization.split(' ');
  if (method !== 'Basic' || !value) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Basic Authorization',
    });
  }

  const basicValue = Buffer.from(value, 'base64').toString('utf-8');
  const index = basicValue.indexOf(':');
  const username = basicValue.substring(0, index);
  const password = basicValue.substring(index + 1);

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Basic Authorization',
    });
  }

  const foundUser = await Database.users.getByUsername(username);
  // always check to avoid timing attack
  const userHashPassword = foundUser?.password ?? null;
  const passwordValid = await isPasswordValid(password, userHashPassword);

  // can't login through basic auth if 2fa enabled
  if (!foundUser || !passwordValid || foundUser.totpVerified) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Session failed',
    });
  }

  return foundUser;
}

/**
 * @throws
 */
export async function getCurrentUser(event: H3Event) {
  const session = await useWGSession(event);

  const authorization = getHeader(event, 'Authorization');

  let user: UserType | undefined;
  if (authorization) {
    // Support Basic Authentication
    // TODO: support personal access token or similar
    user = await getBasicAuthUser(authorization);
  } else if (session.data.userId) {
    // Handle if authenticating using Session
    user = await Database.users.get(session.data.userId);
  } else {
    throw createError({
      statusCode: 401,
      statusMessage: 'Session failed. No Authorization',
    });
  }

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Session failed. User not found',
    });
  }

  if (!user.enabled) {
    throw createError({
      statusCode: 403,
      statusMessage: 'User is disabled',
    });
  }

  if (session.data.userId) {
    // reseal cookie to update max age
    await updateWGSession(event);
  }

  return user;
}
