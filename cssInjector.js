// Safe-by-default selectors — ads and popups only.
const DEFAULT_HIDE_SELECTORS = [
  '[class*="ad-"]', '[class*="-ad"]', '[id*="google_ads"]',
  'iframe[src*="ads"]', '[class*="advertisement"]',
  '[class*="cookie"]', '[id*="cookie"]', '[class*="consent"]',
  '[class*="popup"]', '[class*="modal"]',
  '[class*="newsletter"]', '[class*="subscribe"]',
];

export function buildInjectionCss(extraSelectors = []) {
  const selectors = [...DEFAULT_HIDE_SELECTORS, ...extraSelectors];

  return `
${selectors.join(',\n')} {
  display: none !important;
}

h1, h2, h3, h4 { page-break-after: avoid; }
tr { page-break-inside: avoid; }
`;
}