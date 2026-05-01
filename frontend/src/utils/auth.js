const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    clearSession();
    return null;
  }
};

export const storeSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => Boolean(getToken() && getStoredUser());
