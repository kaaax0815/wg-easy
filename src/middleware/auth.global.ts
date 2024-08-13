// TODO: move middleware to server
export default defineNuxtRouteMiddleware(async (to) => {
  // TODO?: cache session
  const session = await useUISession();
  if (!session) {
    if (to.path !== 'login') {
      return navigateTo('/login');
    }
    return abortNavigation();
  }
  if (to.path === '/login') {
    if (session.authenticated || !session.requiresPassword) {
      return navigateTo('/');
    }
  }
  if (to.path === '/') {
    if (!session.authenticated) {
      return navigateTo('/login');
    }
  }
});
