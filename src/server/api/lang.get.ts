export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/json');
  return Database.getLang();
});
