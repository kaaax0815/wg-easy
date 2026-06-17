export default defineEventHandler(async (event) => {
  await updateWGSession(event, {
    pendingLogin: undefined,
    oauth_nonce: undefined,
    oauth_state: undefined,
    oauth_verifier: undefined,
  });

  return { success: true as const };
});
