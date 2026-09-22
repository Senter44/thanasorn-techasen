const places = new Set(['projects', 'experience', 'about', 'toolkit', 'contact']);
export function createState(reducedMotion = false) {
  return {place:null, view:'map', paused:reducedMotion};
}
export function navigate(state, place) {
  return place === null || places.has(place) ? {...state, place} : state;
}
export function setView(state, view) {
  return view === 'map' || view === 'list' ? {...state, view} : state;
}
export function toggleMotion(state) {
  return {...state, paused:!state.paused};
}
export function shouldAnimate(state, visible) {
  return visible && state.view === 'map' && !state.place && !state.paused;
}
