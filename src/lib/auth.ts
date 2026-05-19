const ADMIN_PASSWORD_KEY = 'glow-bela-admin-pw';
const SESSION_KEY = 'glow-bela-session';

export interface AdminUser {
  name: string;
  initials: string;
}

export function setAdminPassword(password: string): void {
  localStorage.setItem(ADMIN_PASSWORD_KEY, btoa(password));
}

export function getAdminPassword(): string | null {
  const encoded = localStorage.getItem(ADMIN_PASSWORD_KEY);
  return encoded ? atob(encoded) : null;
}

export function login(password: string): boolean {
  const storedPw = getAdminPassword();
  if (!storedPw) {
    setAdminPassword(password);
    sessionStorage.setItem(SESSION_KEY, 'active');
    return true;
  }
  if (password === storedPw) {
    sessionStorage.setItem(SESSION_KEY, 'active');
    return true;
  }
  return false;
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'active';
}

export function getCurrentUser(): AdminUser {
  return {
    name: 'Admin',
    initials: 'GB',
  };
}
