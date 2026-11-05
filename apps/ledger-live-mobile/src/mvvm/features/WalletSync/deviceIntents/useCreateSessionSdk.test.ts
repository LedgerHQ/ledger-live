import { renderHook } from "@tests/test-renderer";
import { firstValueFrom, of } from "rxjs";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import type { WithDevice } from "@ledgerhq/ledger-key-ring-protocol/types";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { useCreateSessionSdk } from "./useCreateSessionSdk";

const CONTEXT = { applicationId: 16, name: "Mobile instance", apiBaseUrl: "https://trustchain" };

jest.mock("@ledgerhq/ledger-key-ring-protocol/index", () => ({
  ...jest.requireActual("@ledgerhq/ledger-key-ring-protocol/index"),
  getSdk: jest.fn(() => ({ name: "session sdk" })),
}));
jest.mock("../hooks/useTrustchainSdkContext", () => ({
  useTrustchainSdkContext: () => ({ isMockEnv: false, context: CONTEXT }),
}));

const CONNECTION = {
  dmk: { sendApdu: jest.fn() } as never,
  sessionId: "session-1",
  connectedDevice: {} as never,
  compatDeviceId: "compat-1",
  compatDeviceName: "Ledger Stax",
  compatDeviceWired: true,
} satisfies DeviceConnectionResult;

describe("useCreateSessionSdk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should build the SDK with the app context", () => {
    const { result } = renderHook(() => useCreateSessionSdk());

    expect(result.current(CONNECTION)).toEqual({ name: "session sdk" });
    expect(getSdk).toHaveBeenCalledWith(false, CONTEXT, expect.any(Function));
  });

  it("should run each device job on a transport bound to the DIE session", async () => {
    const { result } = renderHook(() => useCreateSessionSdk());
    result.current(CONNECTION);
    const withDevice = jest.mocked(getSdk).mock.calls.at(-1)?.[2] as WithDevice;
    const job = jest.fn(transport => of(transport));

    const run = withDevice("any-device-id")(job);
    expect(job).not.toHaveBeenCalled();
    const transport = await firstValueFrom(run);

    expect(transport).toBeInstanceOf(DmkCompatTransport);
    expect(transport).toMatchObject({ dmk: CONNECTION.dmk, sessionId: "session-1" });
  });
});
