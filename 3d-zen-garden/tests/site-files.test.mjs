import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
test('every garden destination has matching readable content', () => {
  for (const place of ['projects','experience','about','toolkit','contact']) {
    assert.match(html, new RegExp(`data-open="${place}"`));
    assert.match(html, new RegExp(`data-panel="${place}"`));
  }
});
test('all directly referenced local page assets are present', () => {
  for (const [,value] of html.matchAll(/(?:src|href)="(\.\/[^"?#]*)/g)) {
    assert.ok(existsSync(new URL('../dist/' + value, import.meta.url)), value);
  }
});
test('CV and contact stay available without map discovery', () => {
  assert.match(html, /id="destinations"/);
  assert.match(html, /<noscript>/);
  assert.match(html, /mailto:hydrolysis4re@gmail.com/);
  assert.match(html, /href="https:\/\/github.com\/Senter44"/);
  assert.ok(existsSync(new URL('../dist/assets/thanasorn-techasen-cv.pdf', import.meta.url)));
});
test('light and dark modes are available without changing the 3D scene', () => {
  assert.match(html, /id="theme-toggle"/);
  assert.match(html, /src="\.\/theme-init\.js\?v=1"/);
  assert.match(html, /href="\.\/theme\.css\?v=1"/);
  const main = readFileSync(new URL('../dist/main.js', import.meta.url), 'utf8');
  assert.match(main, /theme-state\.mjs/);
});
test('language selector lists English and Thai and can grow with more options', () => {
  assert.match(html, /<label[^>]*for="language-select"/);
  assert.match(html, /<select id="language-select"[^>]*>/);
  assert.match(html, /<option value="en"[^>]*>English<\/option>/);
  assert.match(html, /<option value="th"[^>]*>ไทย<\/option>/);
  assert.match(html, /src="\.\/language-init\.js\?v=1"/);
  assert.match(html, /href="\.\/language\.css\?v=3"/);
  const main = readFileSync(new URL('../dist/main.js', import.meta.url), 'utf8');
  assert.match(main, /i18n\.mjs/);
  assert.match(main, /languageSelect\.addEventListener\('change'/);
});
test('language selector reads as a dropdown, not a two-state switch', () => {
  const css = readFileSync(new URL('../dist/language.css', import.meta.url), 'utf8');
  assert.match(html, /class="language-field"/);
  assert.match(html, /class="language-chevron" aria-hidden="true"/);
  assert.match(css, /\.language-field select\s*\{[^}]*appearance:\s*none/s);
  assert.doesNotMatch(css, /\.language-switch\s*\{[^}]*border-radius:\s*30px/s);
});
test('the complete Three.js import graph is vendored locally',()=>{
  const root=new URL('../dist/',import.meta.url);
  const seen=new Set();
  function visit(url){
    if(seen.has(url.href))return;
    seen.add(url.href);
    assert.ok(existsSync(url),url.href);
    const source=readFileSync(url,'utf8');
    for(const [,specifier] of source.matchAll(/^[ \t]*(?:import|export)\s+(?:[^;]*?\sfrom\s*)?['"]([^'"]+)['"]/gm)){
      const target=specifier==='three'?new URL('vendor/three.module.js',root):specifier.startsWith('three/addons/')?new URL('vendor/addons/'+specifier.slice(13),root):new URL(specifier,url);
      target.search='';
      visit(target);
    }
  }
  visit(new URL('scene.js',root));
  assert.ok(seen.size>=7);
  for(const asset of ['assets/garden.glb','bamboo-3d/bamboo.glb'])assert.ok(existsSync(new URL(asset,root)),asset);
});

test('changed scene detail modules use revisioned URLs for returning visitors', () => {
  const scene = readFileSync(new URL('../dist/scene.js', import.meta.url), 'utf8');
  const diorama = readFileSync(new URL('../dist/detail-diorama.js', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../dist/main.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.match(scene, /scene-details\.js\?v=4/);
  assert.match(scene, /focus-details\.js\?v=4/);
  assert.match(scene, /detail-diorama\.js\?v=2/);
  assert.match(diorama, /detail-layout\.mjs\?v=2/);
  assert.match(main, /scene\.js\?v=6/);
  assert.match(html, /main\.js\?v=three-9/);
});

test('high-detail preview keeps its photographic stone maps local and web-sized', () => {
  for (const name of ['rock_01_diff_1k.jpg', 'rock_01_nor_gl_1k.jpg', 'mossy_rock_diff_1k.jpg', 'mossy_rock_nor_gl_1k.jpg']) {
    const path = new URL(`../dist/assets/materials/${name}`, import.meta.url);
    assert.ok(existsSync(path), name);
    assert.ok(statSync(path).size < 2_000_000, name);
    const bytes = readFileSync(path);
    assert.equal(bytes[0], 0xff);
    assert.equal(bytes[1], 0xd8);
  }
});
