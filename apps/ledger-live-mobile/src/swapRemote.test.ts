import { Platform } from "react-native";

const registerRemotesMock = jest.fn();

jest.mock("@module-federation/enhanced/runtime", () => ({
  registerRemotes: (...args: unknown[]) => registerRemotesMock(...args),
}));

let baseUrl = "https://prod.example/swap";
jest.mock("~/state-manager/configureStore", () => ({ store: { getState: () => ({}) } }));
jest.mock("@shared/feature-flags", () => ({
  selectFeature: () => ({ params: { baseUrl } }),
}));

const devManifest = `http://localhost:9000/${Platform.OS}/mf-manifest.json`;
const prodManifest = () => `${baseUrl}/${Platform.OS}/mf-manifest.json`;

const loadEnsureSwapRemote = async () => (await import("./swapRemote")).ensureSwapRemote;

describe("ensureSwapRemote", () => {
  const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules(); // reset the module-level registered/resolving cache between cases
    registerRemotesMock.mockClear();
    baseUrl = "https://prod.example/swap";
    fetchMock = jest.fn();
    (globalThis as { fetch?: unknown }).fetch = fetchMock;
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
  });

  afterAll(() => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
  });

  it("registers the local dev server when it is reachable (dev)", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const ensureSwapRemote = await loadEnsureSwapRemote();

    await expect(ensureSwapRemote()).resolves.toBe(true);
    expect(registerRemotesMock).toHaveBeenCalledWith([{ name: "swap", entry: devManifest }], {
      force: true,
    });
  });

  it("falls back to the production URL when the dev server is down (dev)", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED")).mockResolvedValueOnce({ ok: true });
    const ensureSwapRemote = await loadEnsureSwapRemote();

    await expect(ensureSwapRemote()).resolves.toBe(true);
    expect(registerRemotesMock).toHaveBeenCalledWith([{ name: "swap", entry: prodManifest() }], {
      force: true,
    });
  });

  it("returns false and registers nothing when neither is reachable", async () => {
    fetchMock.mockResolvedValue({ ok: false });
    const ensureSwapRemote = await loadEnsureSwapRemote();

    await expect(ensureSwapRemote()).resolves.toBe(false);
    expect(registerRemotesMock).not.toHaveBeenCalled();
  });

  it("only probes the production URL outside dev", async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    fetchMock.mockResolvedValue({ ok: true });
    const ensureSwapRemote = await loadEnsureSwapRemote();

    await expect(ensureSwapRemote()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(prodManifest(), expect.anything());
  });

  it("probes and registers only once across calls (idempotent)", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const ensureSwapRemote = await loadEnsureSwapRemote();

    await ensureSwapRemote();
    await ensureSwapRemote();
    expect(registerRemotesMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
