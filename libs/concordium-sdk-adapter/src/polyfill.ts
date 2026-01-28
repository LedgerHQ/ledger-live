/**
 * Polyfill browser globals for @concordium/web-sdk
 *
 * The Concordium SDK uses UMD patterns that expect browser globals (self, document, location).
 * This polyfill must be imported BEFORE any @concordium/web-sdk imports.
 *
 * @see libs/coin-modules/coin-concordium/jest.setup.js for the test equivalent
 * @see libs/ledger-live-common/src/__tests__/test-helpers/dom-polyfill.ts for similar pattern
 */

if (typeof self === "undefined") {
  // @ts-expect-error Polyfill: assigning globalThis to self in non-browser environment
  globalThis.self = globalThis;
}

if (typeof document === "undefined") {
  // @ts-expect-error Polyfill: minimal document stub for non-browser environment
  globalThis.document = { baseURI: "" };
}

if (typeof location === "undefined") {
  // @ts-expect-error Polyfill: minimal location stub for non-browser environment
  globalThis.location = { href: "" };
}
