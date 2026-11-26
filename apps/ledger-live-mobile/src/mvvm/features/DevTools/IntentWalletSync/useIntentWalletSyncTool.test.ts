import { renderHook } from "@tests/test-renderer";
import { createKeyRingClient } from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import { useIntentWalletSyncToolState } from "@devtools/bindings";
import { ledgerSyncResultOrder } from "../../WalletSync/deviceIntents/ledgerSyncResultOrder";
import { useIntentWalletSyncTool } from "./useIntentWalletSyncTool";

const mockAppClient = fakeKeyRingClient();

jest.mock("@features/platform-key-ring", () => ({
  ...jest.requireActual("@features/platform-key-ring"),
  createKeyRingClient: jest.fn(),
}));
jest.mock("@devtools/bindings", () => ({ useIntentWalletSyncToolState: jest.fn(() => ({})) }));
jest.mock("../../WalletSync/hooks/useKeyRingClient", () => ({
  useKeyRingClient: () => mockAppClient,
}));

function lastToolParams() {
  const params = jest.mocked(useIntentWalletSyncToolState).mock.lastCall?.[0];
  if (!params) throw new Error("the tool state was not built");
  return params;
}

describe("useIntentWalletSyncTool", () => {
  it("should list members and run intents with the app client, building no client", () => {
    const { rerender } = renderHook(() => useIntentWalletSyncTool());
    rerender({});

    expect(lastToolParams()).toMatchObject({ keyRing: mockAppClient });
    expect(createKeyRingClient).not.toHaveBeenCalled();
  });

  it("should pass the app's result order, the one its Ledger Sync screens use", () => {
    renderHook(() => useIntentWalletSyncTool());

    expect(lastToolParams().resultOrder).toBe(ledgerSyncResultOrder);
  });
});
