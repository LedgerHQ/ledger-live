import { renderHook } from "@tests/test-renderer";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { useIntentWalletSyncToolState } from "@devtools/bindings";
import { buildDeviceConnection } from "../../WalletSync/deviceIntents/__tests__/ledgerSyncIntentTestKit";
import { useIntentWalletSyncTool } from "./useIntentWalletSyncTool";

const PRODUCTION_URL = "https://trustchain.production";
const STAGING_URL = "https://trustchain.staging";

const mockSetup = {
  current: {
    isMockEnv: false,
    context: { applicationId: 16, name: "Mobile instance", apiBaseUrl: PRODUCTION_URL },
  },
};

jest.mock("@ledgerhq/ledger-key-ring-protocol/index", () => ({
  ...jest.requireActual("@ledgerhq/ledger-key-ring-protocol/index"),
  getSdk: jest.fn((_isMockEnv: boolean, context: { apiBaseUrl: string }) => ({
    apiBaseUrl: context.apiBaseUrl,
  })),
}));
jest.mock("@devtools/bindings", () => ({ useIntentWalletSyncToolState: jest.fn(() => ({})) }));
jest.mock("../../WalletSync/hooks/useTrustchainSdkContext", () => ({
  useTrustchainSdkContext: () => mockSetup.current,
}));

function lastToolParams() {
  const params = jest.mocked(useIntentWalletSyncToolState).mock.lastCall?.[0];
  if (!params) throw new Error("the tool state was not built");
  return params;
}

describe("useIntentWalletSyncTool", () => {
  it("should list members and run intents on the same backend after the environment changes", () => {
    const { rerender } = renderHook(() => useIntentWalletSyncTool());
    expect(lastToolParams().sdk).toMatchObject({ apiBaseUrl: PRODUCTION_URL });

    mockSetup.current = {
      ...mockSetup.current,
      context: { ...mockSetup.current.context, apiBaseUrl: STAGING_URL },
    };
    rerender({});

    const { sdk, createSessionSdk } = lastToolParams();
    expect(sdk).toMatchObject({ apiBaseUrl: STAGING_URL });
    expect(createSessionSdk(buildDeviceConnection("session-1"))).toMatchObject({
      apiBaseUrl: STAGING_URL,
    });
    expect(getSdk).toHaveBeenCalledTimes(3);
  });
});
