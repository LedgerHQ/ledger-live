// The UI tree is irrelevant to boot wiring and does not load under jest, so it is stubbed out.
jest.mock("~/renderer/ReactRoot", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/AppError", () => ({ __esModule: true, default: () => null }));
// Boot parks at its first storage read, after the synchronous wiring under test, so the rest of it
// (hydration, network) never runs.
jest.mock("~/renderer/storage", () => ({
  ...jest.requireActual("~/renderer/storage"),
  getKey: jest.fn(() => new Promise(() => {})),
}));
jest.mock("~/config/bridge-setup", () => ({
  setupCryptoAssetsStore: jest.fn(),
  setupRateLookups: jest.fn(),
}));

describe("renderer init", () => {
  it("registers the rate lookups when the renderer boots", () => {
    expect(() => require("./init")).not.toThrow();
    const { setupRateLookups } = require("~/config/bridge-setup");

    expect(setupRateLookups).toHaveBeenCalledTimes(1);
  });
});
