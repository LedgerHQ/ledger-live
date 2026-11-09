import { renderHook } from "@tests/test-renderer";
import { firstValueFrom, of } from "rxjs";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import type { WithDevice } from "@ledgerhq/ledger-key-ring-protocol/types";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { buildDeviceConnection } from "./__tests__/ledgerSyncIntentTestKit";
import { useCreateSessionSdk } from "./useCreateSessionSdk";

const mockContext = {
  applicationId: 16,
  name: "Mobile instance",
  apiBaseUrl: "https://trustchain",
};

jest.mock("@ledgerhq/ledger-key-ring-protocol/index", () => {
  const actual = jest.requireActual("@ledgerhq/ledger-key-ring-protocol/index");
  return { ...actual, getSdk: jest.fn(actual.getSdk) };
});
jest.mock("../hooks/useTrustchainSdkContext", () => ({
  useTrustchainSdkContext: () => ({ isMockEnv: false, context: mockContext }),
}));

const CONNECTION = buildDeviceConnection("session-1");

function lastWithDevice(): WithDevice {
  const withDevice = jest.mocked(getSdk).mock.lastCall?.[2];
  if (!withDevice) throw new Error("getSdk was not called");
  return withDevice;
}

describe("useCreateSessionSdk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should build the SDK with the app context", () => {
    const { result } = renderHook(() => useCreateSessionSdk());

    const sdk = result.current(CONNECTION);

    expect(getSdk).toHaveBeenCalledWith(false, mockContext, expect.any(Function));
    expect(sdk).toBe(jest.mocked(getSdk).mock.results.at(-1)?.value);
  });

  it("should run each device job on a transport bound to the DIE session", async () => {
    const { result } = renderHook(() => useCreateSessionSdk());
    result.current(CONNECTION);
    const onJobStarted = jest.fn();

    const run = lastWithDevice()("any-device-id")(transport => {
      onJobStarted();
      return of(transport);
    });
    expect(onJobStarted).not.toHaveBeenCalled();
    const transport = await firstValueFrom(run);

    expect(transport).toBeInstanceOf(DmkCompatTransport);
    expect(transport).toMatchObject({ dmk: CONNECTION.dmk, sessionId: "session-1" });
  });
});
