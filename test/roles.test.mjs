import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROLE_TEMPLATES, getTemplate, getPublicMetadata, buildPrompt } from '../api/role-templates.js';

const SECTION_KEYS = ['analyst', 'financial', 'product', 'culture'];

// Keywords the frontend renderer (getSectionIcon) keys off to pick an icon and
// to normalize sections for comparison. If a section label stops containing one
// of these, the report renders with the wrong icon / breaks comparison.
const LABEL_KEYWORDS = {
  analyst: ['analyst', 'recognition', 'gartner', 'brand'],
  financial: ['financial'],
  product: ['product', 'customer'],
  culture: ['culture', 'employee', 'community', 'leadership'],
};

for (const [id, t] of Object.entries(ROLE_TEMPLATES)) {
  test(`${id}: weights sum to 100`, () => {
    const sum = SECTION_KEYS.reduce((acc, k) => acc + t.weights[k], 0);
    assert.equal(sum, 100, `weights sum to ${sum}, expected 100`);
  });

  test(`${id}: has all four section labels`, () => {
    for (const k of SECTION_KEYS) {
      assert.ok(t.sectionLabels[k] && t.sectionLabels[k].trim().length > 0, `missing sectionLabels.${k}`);
    }
  });

  test(`${id}: section labels contain renderer keywords`, () => {
    for (const k of SECTION_KEYS) {
      const label = t.sectionLabels[k].toLowerCase();
      const ok = LABEL_KEYWORDS[k].some(kw => label.includes(kw));
      assert.ok(ok, `sectionLabels.${k} ("${t.sectionLabels[k]}") lacks any of: ${LABEL_KEYWORDS[k].join(', ')}`);
    }
  });

  test(`${id}: has exactly six loading steps`, () => {
    assert.ok(Array.isArray(t.loadingSteps), 'loadingSteps not an array');
    assert.equal(t.loadingSteps.length, 6);
  });
}

test('getTemplate falls back to general for unknown id', () => {
  assert.equal(getTemplate('does-not-exist'), ROLE_TEMPLATES.general);
});

test('getPublicMetadata returns the UI-relevant shape for every role', () => {
  const meta = getPublicMetadata();
  assert.equal(meta.length, Object.keys(ROLE_TEMPLATES).length);
  for (const m of meta) {
    for (const key of ['id', 'label', 'tagline', 'weights', 'sectionLabels', 'loadingSteps']) {
      assert.ok(key in m, `metadata missing ${key}`);
    }
    // Must not leak server-only prompt fields to the browser.
    assert.ok(!('systemPersona' in m), 'systemPersona leaked into public metadata');
  }
});

test('buildPrompt substitutes company and falls back for unknown role', () => {
  const prompt = buildPrompt('does-not-exist', { company: 'Acme', industry: '', jobTitle: '' });
  assert.ok(prompt.includes('Acme'), 'company not substituted');
  assert.ok(!prompt.includes('{{COMPANY}}'), 'unsubstituted {{COMPANY}} placeholder remains');
});
