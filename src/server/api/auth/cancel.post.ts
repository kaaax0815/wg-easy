export default defineEventHandler(async (event) => {
  const session = await useWGSession(event);
  await session.clear();

  return { success: true as const };
});
