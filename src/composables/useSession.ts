export async function useUISession() {
  try {
    const session = await api.getSession();
    return session;
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message || err.toString());
    }
    return null;
  }
}
