// Polyfill browser globals for WASM modules in concordium-sdk-adapter
// The Concordium SDK's bundled WASM code expects browser globals
global.self = global;
global.document = {
  baseURI: "http://localhost/",
};
global.location = {
  href: "http://localhost/",
};

// Mock WalletConnect ESM-only packages for Jest
jest.mock("@walletconnect/sign-client", () => ({
  __esModule: true,
  default: jest.fn(),
}));
