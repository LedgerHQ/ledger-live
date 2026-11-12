import { renderHook } from "@tests/test-renderer";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { useIntentWalletSyncToolState } from "@devtools/bindings";
import { useIntentWalletSyncTool } from "./useIntentWalletSyncTool";

const mockAppSdk = { name: "app SDK" };
const mockCreateSessionSdk = jest.fn();

jest.mock("@ledgerhq/ledger-key-ring-protocol/index", () => ({
  ...jest.requireActual("@ledgerhq/ledger-key-ring-protocol/index"),
  getSdk: jest.fn(),
}));
jest.mock("@devtools/bindings", () => ({ useIntentWalletSyncToolState: jest.fn(() => ({})) }));
jest.mock("../../WalletSync/hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => mockAppSdk,
}));
jest.mock("../../WalletSync/deviceIntents/useCreateSessionSdk", () => ({
  useCreateSessionSdk: () => mockCreateSessionSdk,
}));

function lastToolParams() {
  const params = jest.mocked(useIntentWalletSyncToolState).mock.lastCall?.[0];
  if (!params) throw new Error("the tool state was not built");
  return params;
}

describe("useIntentWalletSyncTool", () => {
  it("should list members with the app SDK and run intents with the session SDK, building no SDK", () => {
    const { rerender } = renderHook(() => useIntentWalletSyncTool());
    rerender({});

    expect(lastToolParams()).toMatchObject({
      sdk: mockAppSdk,
      createSessionSdk: mockCreateSessionSdk,
    });
    expect(getSdk).not.toHaveBeenCalled();
  });
});
