(() => {
  let saved;
  try { saved = localStorage.getItem('garden-theme'); } catch { /* Private browsing may deny storage. */ }
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = saved === 'light' || saved === 'dark'
    ? saved
    : prefersDark ? 'dark' : 'light';
})();
