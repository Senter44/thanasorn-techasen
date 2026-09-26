import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveLanguage, toggleLanguage, translateText} from '../dist/i18n.mjs';

test('saved language wins, with Thai browser language as fallback', () => {
  assert.equal(resolveLanguage('en', 'th-TH'), 'en');
  assert.equal(resolveLanguage('th', 'en-US'), 'th');
  assert.equal(resolveLanguage(null, 'th-TH'), 'th');
  assert.equal(resolveLanguage('invalid', 'en-US'), 'en');
  assert.equal(resolveLanguage(null, undefined), 'en');
});

test('Thai and English switches are reversible', () => {
  assert.equal(toggleLanguage('en'), 'th');
  assert.equal(toggleLanguage('th'), 'en');
});

test('Thai copy covers the page, destinations, and detail text', () => {
  for (const source of [
    'A garden of', 'Selected work', 'My journey', 'A little about me',
    'Skills & CV', 'Let’s connect', 'The systems behind the experience.',
    'I build TypeScript APIs, shared infrastructure, and internal tools for a global CMS and enrollment platform.',
    'From physical networks to digital systems.', 'The tools I reach for, and the foundations behind them.',
    'Have a role, a project, or an interesting systems problem?',
    'Close details and return to garden', 'The 3D garden could not load on this device. You can still explore everything using Quick view or the navigation below.',
  ]) {
    assert.match(translateText(source, 'th'), /[ก-๙]/u, source);
    assert.equal(translateText(source, 'en'), source);
  }
  assert.equal(translateText('  Selected work  ', 'th').trim(), translateText('Selected work', 'th'));
});
