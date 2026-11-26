import { renderHook } from "tests/testSetup";
import type { KeyRingClientSetup } from "./useKeyRingClientSetup";

const PRODUCTION_SETUP: KeyRingClientSetup = {
  isMockEnv: false,
  instanceName: "Desktop instance",
  trustchainApiBaseUrl: "https://trustchain.production",
  cloudSyncApiBaseUrl: "https://cloud-sync.production",
  getCurrentWSState: () => ({ data: null, version: 0 }),
};
const STAGING_RENAMED_SETUP: KeyRingClientSetup = {
  isMockEnv: false,
  instanceName: "Renamed instance",
  trustchainApiBaseUrl: "https://trustchain.staging",
  cloudSyncApiBaseUrl: "https://cloud-sync.staging",
  getCurrentWSState: () => ({ data: null, version: 0 }),
};

const mockCurrentSetup = { current: PRODUCTION_SETUP };
jest.mock("@features/platform-key-ring", () => {
  const { fakeKeyRingClient } = jest.requireActual("@features/platform-key-ring/testing");
  return {
    ...jest.requireActual("@features/platform-key-ring"),
    createKeyRingClient: jest.fn(() =>
      fakeKeyRingClient({
        lifecycle: { onKeyRotation: jest.fn(() => () => undefined), subscribe: jest.fn() },
      }),
    ),
  };
});
jest.mock("@features/platform-wallet-sync", () => ({
  ...jest.requireActual("@features/platform-wallet-sync"),
  createRotationReencryption: jest.fn(() => jest.fn()),
}));
jest.mock("./useKeyRingClientSetup", () => ({
  useKeyRingClientSetup: () => mockCurrentSetup.current,
}));

// The client is cached per module: each test starts from a fresh one.
async function importFreshHooks() {
  jest.resetModules();
  const { keyRingDeviceBridge } = await import("../keyRingDeviceBridge");
  const { createKeyRingClient } = await import("@features/platform-key-ring");
  const { createRotationReencryption } = await import("@features/platform-wallet-sync");
  return {
    ...(await import("./useKeyRingClient")),
    keyRingDeviceBridge,
    createKeyRingClient: jest.mocked(createKeyRingClient),
    createRotationReencryption: jest.mocked(createRotationReencryption),
  };
}

describe("useKeyRingClient", () => {
  beforeEach(() => {
    mockCurrentSetup.current = PRODUCTION_SETUP;
  });

  it("should build the client once, with the setup of the first call", async () => {
    const { useKeyRingClient, keyRingDeviceBridge, createKeyRingClient } = await importFreshHooks();

    const { result } = renderHook(() => useKeyRingClient());

    expect(createKeyRingClient).toHaveBeenCalledTimes(1);
    expect(createKeyRingClient).toHaveBeenCalledWith({
      mock: false,
      instanceName: "Desktop instance",
      apiBaseUrl: "https://trustchain.production",
      deviceBridge: keyRingDeviceBridge,
    });
    expect(result.current).toBe(createKeyRingClient.mock.results[0].value);
  });

  it("should register the rotation re-encryption once, with the setup of the first call", async () => {
    const { useKeyRingClient, createKeyRingClient, createRotationReencryption } =
      await importFreshHooks();

    const { result, rerender } = renderHook(() => useKeyRingClient());
    mockCurrentSetup.current = STAGING_RENAMED_SETUP;
    rerender({});

    expect(createRotationReencryption).toHaveBeenCalledTimes(1);
    expect(createRotationReencryption).toHaveBeenCalledWith({
      cloudSyncApiBaseUrl: "https://cloud-sync.production",
      getCurrentWSState: PRODUCTION_SETUP.getCurrentWSState,
    });
    expect(result.current.lifecycle.onKeyRotation).toHaveBeenCalledTimes(1);
    expect(result.current.lifecycle.onKeyRotation).toHaveBeenCalledWith(
      createRotationReencryption.mock.results[0].value,
    );
    expect(createKeyRingClient).toHaveBeenCalledTimes(1);
  });

  it("should keep the client after the flag environment changes and an instance rename", async () => {
    const { useKeyRingClient, createKeyRingClient } = await importFreshHooks();
    const { result, rerender } = renderHook(() => useKeyRingClient());
    const first = result.current;

    mockCurrentSetup.current = STAGING_RENAMED_SETUP;
    rerender({});
    const later = renderHook(() => useKeyRingClient());

    expect(result.current).toBe(first);
    expect(later.result.current).toBe(first);
    expect(createKeyRingClient).toHaveBeenCalledTimes(1);
  });
});
