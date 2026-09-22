import {createState, navigate, setView, toggleMotion, shouldAnimate} from './garden-state.mjs';
const $ = selector => document.querySelector(selector);
const dialog = $('#detail-dialog');
const gardenMap = $('#garden-map');
const physicsDialog = $('#physics-dialog');
let garden = null;
const motionButton = $('#garden-motion');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let state = createState(reducedMotion.matches);
let opener = null;
const places = {
  projects: {title:'Selected work.', location:'01 / THE ROCK ISLANDS'},
  experience: {title:'The path so far.', location:'02 / THE STEPPING STONES'},
  about: {title:'A curious mind.', location:'03 / THE SHISHI-ODOSHI'},
  toolkit: {title:'My toolkit.', location:'04 / THE PAVILION'},
  contact: {title:'Let’s connect.', location:'05 / BY THE POND'},
};
function syncMotion() {
  const bounds = gardenMap.getBoundingClientRect();
  const visible = !document.hidden && bounds.bottom > 0 && bounds.top < innerHeight;
  garden?.setActive(shouldAnimate(state, visible) && !physicsDialog.open);
  motionButton.setAttribute('aria-pressed', String(state.paused));
  $('#garden-motion-label').textContent = state.paused ? 'Play motion' : 'Pause motion';
}
function openPlace(place, trigger) {
  if (!places[place]) return;
  state = navigate(state, place);
  opener = trigger;
  garden?.focus(place, !state.paused && !reducedMotion.matches);
  $('#detail-title').textContent = places[place].title;
  $('#detail-location').textContent = places[place].location;
  $('#panel-number').textContent = `${Object.keys(places).indexOf(place) + 1} / 5`;
  document.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== place; });
  dialog.showModal();
  document.body.classList.add('reading');
  $('#panel-scroll').scrollTop = 0;
  $('#detail-title').focus({preventScroll:true});
  syncMotion();
}
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openPlace(button.dataset.open, button)));
$('#close-detail').addEventListener('click', () => dialog.close());
$('#return-garden').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  state = navigate(state, null);
  document.body.classList.remove('reading');
  opener?.focus({preventScroll:true});
  syncMotion();
});
for (const [id, view] of [['map-view','map'], ['list-view','list']]) {
  $(`#${id}`).addEventListener('click', () => {
    state = setView(state, view);
    $('#garden-map').hidden = view !== 'map';
    $('#quick-view').hidden = view !== 'list';
    $('#map-view').setAttribute('aria-pressed', String(view === 'map'));
    $('#list-view').setAttribute('aria-pressed', String(view === 'list'));
    syncMotion();
  });
}
document.querySelectorAll('[data-project]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-project]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelectorAll('[data-project-panel]').forEach(panel => { panel.hidden = panel.dataset.projectPanel !== button.dataset.project; });
  });
});
motionButton.addEventListener('click', () => {state = toggleMotion(state); syncMotion();});
reducedMotion.addEventListener('change', () => {state = {...state, paused:reducedMotion.matches}; syncMotion();});
new IntersectionObserver(syncMotion).observe(gardenMap);
window.addEventListener('scroll', syncMotion, {passive:true});
window.addEventListener('resize', syncMotion, {passive:true});
document.addEventListener('visibilitychange', syncMotion);
$('#reset-view').addEventListener('click', () => garden?.reset());
$('#open-physics').addEventListener('click', () => {
  $('#physics-frame').src = './bamboo-3d/';
  physicsDialog.showModal();
  syncMotion();
});
$('#close-physics').addEventListener('click', () => physicsDialog.close());
physicsDialog.addEventListener('close', () => {
  $('#physics-frame').src = 'about:blank';
  $('#open-physics').focus();
  syncMotion();
});
function showSceneError(error) {
  garden?.dispose();
  garden = null;
  gardenMap.classList.remove('scene-loading');
  gardenMap.classList.add('scene-failed');
  $('#scene-status').hidden = false;
  $('#scene-status').textContent = 'The 3D garden could not load on this device. You can still explore everything using Quick view or the navigation below.';
  console.error('Garden rendering failed:', error);
}
gardenMap.classList.add('scene-loading');
import('./scene.js').then(async ({createGarden}) => {
  garden = await createGarden({canvas:$('#garden-canvas'),container:gardenMap,onSelect:place=>openPlace(place,document.querySelector(`.place[data-open="${place}"]`)),onError:showSceneError});
  gardenMap.classList.remove('scene-loading');
  gardenMap.classList.add('scene-ready');
  $('#scene-status').hidden = true;
  syncMotion();
}).catch(showSceneError);
window.addEventListener('pagehide', event => {
  if (event.persisted) garden?.setActive(false);
  else garden?.dispose();
});
window.addEventListener('pageshow', syncMotion);
syncMotion();
