import { renderHook } from "@tests/test-renderer";
import type { KeyRingClientSetup } from "./useKeyRingClientSetup";

const PRODUCTION_SETUP: KeyRingClientSetup = {
  mock: false,
  instanceName: "Mobile instance",
  apiBaseUrl: "https://trustchain.production",
};
const STAGING_RENAMED_SETUP: KeyRingClientSetup = {
  mock: false,
  instanceName: "Renamed instance",
  apiBaseUrl: "https://trustchain.staging",
};

const mockCurrentSetup = { current: PRODUCTION_SETUP };
jest.mock("@features/platform-key-ring", () => ({
  ...jest.requireActual("@features/platform-key-ring"),
  createKeyRingClient: jest.fn(() =>
    jest.requireActual("@features/platform-key-ring/testing").fakeKeyRingClient(),
  ),
}));
jest.mock("./useKeyRingClientSetup", () => ({
  useKeyRingClientSetup: () => mockCurrentSetup.current,
}));

// The client is cached per module: each test starts from a fresh one.
async function importFreshHooks() {
  jest.resetModules();
  const { keyRingDeviceBridge } = await import("../keyRingDeviceBridge");
  const { createKeyRingClient } = await import("@features/platform-key-ring");
  return {
    ...(await import("./useKeyRingClient")),
    keyRingDeviceBridge,
    createKeyRingClient: jest.mocked(createKeyRingClient),
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
      ...PRODUCTION_SETUP,
      deviceBridge: keyRingDeviceBridge,
    });
    expect(result.current).toBe(createKeyRingClient.mock.results[0].value);
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
