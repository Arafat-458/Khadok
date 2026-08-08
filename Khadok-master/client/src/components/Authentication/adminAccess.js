export const ADMIN_EMAIL = 'arafatrahman45@gmail.com';

export const isAdminEmail = (email) => String(email || '').trim().toLowerCase() === ADMIN_EMAIL;

export async function checkAdminAccess(user) {
  return isAdminEmail(user?.email);
}
