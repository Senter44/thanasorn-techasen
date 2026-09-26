export function resolveTheme(saved, prefersDark) {
  if (saved === 'light' || saved === 'dark') return saved;
  return prefersDark ? 'dark' : 'light';
}

export function toggleTheme(current) {
  return current === 'dark' ? 'light' : 'dark';
}

export function themeButtonLabel(current) {
  return current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}
