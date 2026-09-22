import test from 'node:test';
import assert from 'node:assert/strict';
import {fountainCycle, limitPixelRatio, pickDestination, createTapTracker} from '../dist/garden-math.mjs';
test('bamboo fills, tips, pours, and returns continuously', () => {
  assert.equal(fountainCycle(0).angle,-.3);
  assert.equal(fountainCycle(5).phase,'fill');
  assert.equal(fountainCycle(10.5).phase,'tip');
  assert.equal(fountainCycle(11.5).phase,'pour');
  assert.equal(fountainCycle(13).phase,'return');
  assert.deepEqual(fountainCycle(14),fountainCycle(0));
  for(let t=0;t<28;t+=.04){const s=fountainCycle(t);assert.ok(s.angle>=-.30001&&s.angle<=.78001);assert.ok(s.fill>=0&&s.fill<=1);}
});
test('render resolution caps high DPI on mobile and desktop',()=>{
  assert.equal(limitPixelRatio(3,390),1);
  assert.equal(limitPixelRatio(3,1440),1.5);
  assert.equal(limitPixelRatio(1,1440),1);
});
test('mesh families map to correct portfolio destinations',()=>{
  assert.equal(pickDestination('ProjectsRock.001'),'projects');
  assert.equal(pickDestination('Pavilion_Roof'),'toolkit');
  assert.equal(pickDestination('JourneyStone'),'experience');
  assert.equal(pickDestination('PondWater'),'contact');
  assert.equal(pickDestination('Bamboo'),'about');
  assert.equal(pickDestination('TreeLeaf'),null);
});
test('only a single stationary pointer can select an object',()=>{
  const tap=createTapTracker();
  tap.down(1,10,10);assert.equal(tap.up(1,12,12),true);
  tap.down(1,10,10);tap.move(1,30,10);assert.equal(tap.up(1,10,10),false);
  tap.down(1,10,10);tap.down(2,20,10);assert.equal(tap.up(2,20,10),false);assert.equal(tap.up(1,10,10),false);
  tap.down(1,10,10);tap.cancel(1);assert.equal(tap.up(1,10,10),false);
  tap.down(3,1,1);assert.equal(tap.up(3,1,1),true);
});
