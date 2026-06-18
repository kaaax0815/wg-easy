import type { H3Event, SessionData } from 'h3';
import type { UserType } from '#db/repositories/user/types';

export type WGSession = Partial<{
  userId: ID;
  rememberMe: boolean;
  pendingLogin: {
    type: 'password' | 'oauth';
    userId: ID;
    /** in milliseconds */
    expires_at: number;
  };
  oauth_verifier: string;
  oauth_nonce: string;
  oauth_state: string;
}>;

const name = 'wg-easy';

function getMaxAge(rememberMe: boolean, sessionTimeout: number) {
  if (rememberMe) {
    return sessionTimeout;
  }
  // 15min (instead of default 1h)
  const SHORT_SESSION_TIMEOUT = 15 * 60;
  // use shorter timeout
  return Math.min(sessionTimeout, SHORT_SESSION_TIMEOUT);
}

/**
 * Don't use `session.update()` for setting `rememberMe`, use {@link updateWGSession}
 */
export async function useWGSession(event: H3Event) {
  const session = await getWGSession(event);
  const sessionConfig = await Database.general.getSessionConfig();

  const maxAge = getMaxAge(
    session.data.rememberMe ?? false,
    sessionConfig.sessionTimeout
  );

  return useSession<WGSession>(event, {
    password: sessionConfig.sessionPassword,
    name,
    maxAge,
    cookie: {
      secure: !WG_ENV.INSECURE,
      expires: undefined,
      maxAge,
    },
  });
}

export async function getWGSession(event: H3Event) {
  const sessionConfig = await Database.general.getSessionConfig();

  // this only matters for new empty sessions
  const maxAge = getMaxAge(false, sessionConfig.sessionTimeout);

  return getSession<WGSession>(event, {
    password: sessionConfig.sessionPassword,
    name,
    maxAge,
    cookie: {
      secure: !WG_ENV.INSECURE,
      expires: undefined,
      maxAge,
    },
  });
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
  const session = await getWGSession(event);
  const sessionConfig = await Database.general.getSessionConfig();

  const maxAge = getMaxAge(
    update?.rememberMe ?? session.data.rememberMe ?? false,
    sessionConfig.sessionTimeout
  );

  return updateSession<WGSession>(
    event,
    {
      password: sessionConfig.sessionPassword,
      name,
      maxAge,
      cookie: {
        secure: !WG_ENV.INSECURE,
        expires: undefined,
        maxAge,
      },
    },
    update
  );
}

/**
 * @throws
 */
export async function getCurrentUser(event: H3Event) {
  const session = await getWGSession(event);

  const authorization = getHeader(event, 'Authorization');

  let user: UserType | undefined;
  if (session.data.userId) {
    // Handle if authenticating using Session
    user = await Database.users.get(session.data.userId);
  } else if (authorization) {
    if (WG_ENV.DISABLE_PASSWORD_AUTH) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Password authentication is disabled',
      });
    }

    // Handle if authenticating using Header
    const [method, value] = authorization.split(' ');
    // Support Basic Authentication
    // TODO: support personal access token or similar
    if (method !== 'Basic' || !value) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid Basic Authorization',
      });
    }

    const basicValue = Buffer.from(value, 'base64').toString('utf-8');

    // Split by first ":"
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
    user = foundUser;
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
