import { renderHook } from "@tests/test-renderer";
import type { TrustchainSdkSetup } from "./useTrustchainSdkContext";

const PRODUCTION_SETUP: TrustchainSdkSetup = {
  isMockEnv: false,
  context: {
    applicationId: 16,
    name: "Mobile instance",
    apiBaseUrl: "https://trustchain.production",
  },
};
const STAGING_RENAMED_SETUP: TrustchainSdkSetup = {
  isMockEnv: false,
  context: {
    applicationId: 16,
    name: "Renamed instance",
    apiBaseUrl: "https://trustchain.staging",
  },
};

const mockCurrentSetup = { current: PRODUCTION_SETUP };
jest.mock("@ledgerhq/ledger-key-ring-protocol/index", () => ({
  ...jest.requireActual("@ledgerhq/ledger-key-ring-protocol/index"),
  getSdk: jest.fn(() => ({})),
}));
jest.mock("./useTrustchainSdkContext", () => ({
  useTrustchainSdkContext: () => mockCurrentSetup.current,
}));

// The SDK is cached per module: each test starts from a fresh one.
async function importFreshHooks() {
  jest.resetModules();
  const { withDevice } = await import("@ledgerhq/live-common/hw/deviceAccess");
  const { getSdk } = await import("@ledgerhq/ledger-key-ring-protocol/index");
  return { ...(await import("./useTrustchainSdk")), withDevice, getSdk: jest.mocked(getSdk) };
}

describe("useTrustchainSdk", () => {
  beforeEach(() => {
    mockCurrentSetup.current = PRODUCTION_SETUP;
  });

  it("should build the SDK once, with the setup of the first call", async () => {
    const { useTrustchainSdk, useTrustchainSdkSetup, withDevice, getSdk } =
      await importFreshHooks();

    const { result } = renderHook(() => ({
      sdk: useTrustchainSdk(),
      setup: useTrustchainSdkSetup(),
    }));

    expect(getSdk).toHaveBeenCalledTimes(1);
    expect(getSdk).toHaveBeenCalledWith(false, PRODUCTION_SETUP.context, withDevice);
    expect(result.current.sdk).toBe(getSdk.mock.results[0].value);
    expect(result.current.setup).toBe(PRODUCTION_SETUP);
  });

  it("should keep the SDK and its setup after the flag environment changes and an instance rename", async () => {
    const { useTrustchainSdk, useTrustchainSdkSetup, getSdk } = await importFreshHooks();
    const { result, rerender } = renderHook(() => ({
      sdk: useTrustchainSdk(),
      setup: useTrustchainSdkSetup(),
    }));
    const first = result.current;

    mockCurrentSetup.current = STAGING_RENAMED_SETUP;
    rerender({});
    const later = renderHook(() => useTrustchainSdkSetup());

    expect(result.current.sdk).toBe(first.sdk);
    expect(result.current.setup).toBe(PRODUCTION_SETUP);
    expect(later.result.current).toBe(PRODUCTION_SETUP);
    expect(getSdk).toHaveBeenCalledTimes(1);
  });

  it("should build the SDK with the setup of the first call when the setup is read first", async () => {
    const { useTrustchainSdk, useTrustchainSdkSetup, withDevice, getSdk } =
      await importFreshHooks();
    const setup = renderHook(() => useTrustchainSdkSetup());

    mockCurrentSetup.current = STAGING_RENAMED_SETUP;
    renderHook(() => useTrustchainSdk());

    expect(setup.result.current).toBe(PRODUCTION_SETUP);
    expect(getSdk).toHaveBeenCalledTimes(1);
    expect(getSdk).toHaveBeenCalledWith(false, PRODUCTION_SETUP.context, withDevice);
  });
});
