(() => {
  let saved;
  try { saved = localStorage.getItem('garden-language'); } catch { /* Storage can be unavailable. */ }
  document.documentElement.lang = saved === 'en' || saved === 'th'
    ? saved
    : navigator.language?.toLowerCase().startsWith('th') ? 'th' : 'en';
})();
