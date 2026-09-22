const smooth = t => t*t*(3-2*t);
export function fountainCycle(time) {
  const t = ((time%14)+14)%14;
  if(t<10) return {angle:-.3,fill:t/10,phase:'fill'};
  if(t<11) return {angle:-.3+1.08*smooth(t-10),fill:1,phase:'tip'};
  if(t<12) return {angle:.78,fill:1-(t-11),phase:'pour'};
  return {angle:.78-1.08*smooth((t-12)/2),fill:0,phase:'return'};
}
export function limitPixelRatio(ratio,width) { return Math.min(ratio,width<700?1:1.5); }
export function pickDestination(name) {
  if(name.startsWith('Projects')) return 'projects';
  if(name.startsWith('Pavilion')) return 'toolkit';
  if(name.startsWith('Journey')) return 'experience';
  if(name.startsWith('Pond')) return 'contact';
  if(name.startsWith('Bamboo')) return 'about';
  return null;
}
export function createTapTracker() {
  const pointers=new Map();
  let cancelled=false;
  return {
    down(id,x,y){if(!pointers.size)cancelled=false;pointers.set(id,{x,y});if(pointers.size>1)cancelled=true;},
    move(id,x,y){const start=pointers.get(id);if(start&&Math.hypot(x-start.x,y-start.y)>=6)cancelled=true;},
    up(id,x,y){const start=pointers.get(id);const valid=!!start&&!cancelled&&pointers.size===1&&Math.hypot(x-start.x,y-start.y)<6;pointers.delete(id);return valid;},
    cancel(id){cancelled=true;pointers.delete(id);},
    get dragging(){return pointers.size>0;},
  };
}
