import { renderHook } from "tests/testSetup";
import { createKeyRingClient, commitKeyRingTree } from "@features/platform-key-ring";
import { useIntentWalletSyncToolState } from "@devtools/bindings";
import { ledgerSyncResultOrder } from "@features/platform-ledger-sync";
import { useIntentWalletSyncTool } from "./useIntentWalletSyncTool";

const mockAppClient = { name: "app client" };

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

    expect(lastToolParams()).toMatchObject({
      keyRing: mockAppClient,
      commitKeyRingTree,
    });
    expect(createKeyRingClient).not.toHaveBeenCalled();
  });

  it("should pass the app's result order, the one its Ledger Sync screens use", () => {
    renderHook(() => useIntentWalletSyncTool());

    expect(lastToolParams().resultOrder).toBe(ledgerSyncResultOrder);
  });
});
