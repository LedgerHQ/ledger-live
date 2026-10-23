import { BridgeSessionClosed } from "@ledgerhq/live-common/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { BridgeSession } from "@ledgerhq/live-common/wallet-api/bridgeSession";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { broadcastTransactionLogic } from "./LiveAppSDKLogic";

const mockBroadcast = jest.fn();

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/platform/logic", () => ({
  broadcastTransactionLogic: (
    _context: unknown,
    _accountId: string,
    _signedTransaction: unknown,
    broadcast: (account: unknown, parentAccount: unknown, signedOperation: unknown) => unknown,
  ) => broadcast({ id: "account", type: "Account" }, undefined, { operation: { id: "op" } }),
}));

const broadcastWith = (session: BridgeSession) =>
  broadcastTransactionLogic(
    {
      manifest: { id: "app" } as LiveAppManifest,
      dispatch: jest.fn(),
      accounts: [],
      tracking: {} as never,
      mevProtected: false,
    },
    "account",
    {} as never,
    jest.fn(),
    ((key: string) => key) as never,
    session,
  );

describe("broadcastTransactionLogic", () => {
  it("does not broadcast once the session closed while the transaction was prepared", async () => {
    const session = new BridgeSession("https://app.example.com", jest.fn());
    jest.mocked(getAccountBridge).mockImplementation(() => {
      session.close();
      return { broadcast: mockBroadcast } as never;
    });

    await expect(broadcastWith(session)).rejects.toBeInstanceOf(BridgeSessionClosed);
    expect(mockBroadcast).not.toHaveBeenCalled();
  });
});
