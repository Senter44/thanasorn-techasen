'use strict';
function connectGarden() {
  const pause = document.getElementById('pause');
  const canvas = document.getElementById('scene');
  const status = document.getElementById('message');
  if (!pause || !canvas || !status) return;
  canvas.tabIndex = -1;
  let visible = true;
  let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sync = () => {
    if (pause.disabled) return;
    const shouldPause = !visible || !playing;
    if ((pause.getAttribute('aria-pressed') === 'true') !== shouldPause) pause.click();
  };
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'portfolio-state') return;
    visible = event.data.visible === true;
    playing = event.data.playing === true;
    sync();
  });
  new MutationObserver(sync).observe(pause, {attributes:true, attributeFilter:['disabled']});
  new MutationObserver(() => {
    if (status.textContent.includes('could not start')) parent.postMessage({type:'garden-unavailable'}, location.origin);
  }).observe(status, {childList:true, subtree:true});
  parent.postMessage({type:'garden-ready'}, location.origin);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', connectGarden, {once:true});
} else {
  connectGarden();
}
