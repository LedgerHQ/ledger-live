import { renderHook } from "tests/testSetup";
import { firstValueFrom, of } from "rxjs";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { withDevice as appWithDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { buildDeviceConnection } from "./__tests__/ledgerSyncIntentTestKit";
import type { TrustchainSdkSetup } from "../hooks/useTrustchainSdkContext";
import { useTrustchainSdk } from "../hooks/useTrustchainSdk";
import { useCreateSessionSdk } from "./useCreateSessionSdk";

const APP_SETUP: TrustchainSdkSetup = {
  isMockEnv: false,
  context: {
    applicationId: 16,
    name: "Desktop instance",
    apiBaseUrl: "https://trustchain.production",
  },
  lifecycle: { onTrustchainRotation: jest.fn() },
};
const STAGING_RENAMED_SETUP: TrustchainSdkSetup = {
  isMockEnv: false,
  context: {
    applicationId: 16,
    name: "Renamed instance",
    apiBaseUrl: "https://trustchain.staging",
  },
  lifecycle: { onTrustchainRotation: jest.fn() },
};

const mockCurrentSetup = { current: APP_SETUP };

jest.mock("@ledgerhq/ledger-key-ring-protocol/index", () => {
  const actual = jest.requireActual("@ledgerhq/ledger-key-ring-protocol/index");
  return { ...actual, getSdk: jest.fn(actual.getSdk) };
});
jest.mock("../hooks/useTrustchainSdkContext", () => ({
  useTrustchainSdkContext: () => mockCurrentSetup.current,
}));

/** The app SDK is built on the first render, with `APP_SETUP`; the flag then changes. */
function renderAfterFlagChange() {
  const rendered = renderHook(() => {
    useTrustchainSdk();
    return useCreateSessionSdk();
  });
  mockCurrentSetup.current = STAGING_RENAMED_SETUP;
  rendered.rerender({});
  return rendered.result.current;
}

function sessionSdkCalls() {
  return jest.mocked(getSdk).mock.calls.filter(([, , withDevice]) => withDevice !== appWithDevice);
}

describe("useCreateSessionSdk", () => {
  beforeEach(() => {
    jest.mocked(getSdk).mockClear();
    mockCurrentSetup.current = APP_SETUP;
  });

  it("should build the session SDK with the app SDK setup after the flag environment changes and an instance rename", () => {
    const createSessionSdk = renderAfterFlagChange();

    const sdk = createSessionSdk(buildDeviceConnection("session-1"));

    expect(sessionSdkCalls()).toEqual([
      [false, APP_SETUP.context, expect.any(Function), APP_SETUP.lifecycle],
    ]);
    expect(sdk).toBe(jest.mocked(getSdk).mock.results.at(-1)?.value);
  });

  it("should give each session its own SDK, whose device jobs run on that session", async () => {
    const createSessionSdk = renderAfterFlagChange();
    const connections = [buildDeviceConnection("session-1"), buildDeviceConnection("session-2")];

    const sdks = connections.map(connection => createSessionSdk(connection));

    expect(sdks[0]).not.toBe(sdks[1]);
    const transports = await Promise.all(
      sessionSdkCalls().map(([, , withDevice]) =>
        firstValueFrom(withDevice("any-device-id")(transport => of(transport))),
      ),
    );
    transports.forEach((transport, index) => {
      expect(transport).toBeInstanceOf(DmkCompatTransport);
      expect(transport).toMatchObject({
        dmk: connections[index].dmk,
        sessionId: connections[index].sessionId,
      });
    });
  });
});
