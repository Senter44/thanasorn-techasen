import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
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
