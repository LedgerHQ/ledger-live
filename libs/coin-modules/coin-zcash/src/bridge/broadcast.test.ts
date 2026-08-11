/**
 * The bridge's job at broadcast time is to hand the guard its context: the
 * outpoints the signing recorded on the operation, and the account's explorer.
 * The guard itself is covered in logic/transaction/broadcast.unit.test.ts.
 */
import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { broadcast } from "./broadcast";
import { getWalletAccount } from "./getWalletAccount";
import { broadcast as broadcastLogic } from "../logic/transaction/broadcast";
import type { ZcashAccount, ZcashOperationExtra } from "../types/bridge";

jest.mock("./getWalletAccount");
jest.mock("../logic/transaction/broadcast");

const mockGetWalletAccount = getWalletAccount as jest.MockedFunction<typeof getWalletAccount>;
const mockBroadcastLogic = broadcastLogic as jest.MockedFunction<typeof broadcastLogic>;

const TXID = "cc".repeat(32);
const PREVOUT_HASH = "ab".repeat(32);
const TX_HEX = "05" + "00".repeat(63);

const fetchUtxoTx = jest.fn();
const account = { id: "js:2:zcash:xpub:", currency: { id: "zcash" } } as unknown as ZcashAccount;

const submit = (extra: ZcashOperationExtra) =>
  broadcast({
    account,
    signedOperation: {
      signature: TX_HEX,
      operation: { id: "op1", hash: "", extra } as unknown as Operation,
    } as SignedOperation,
  });

beforeEach(() => {
  jest.clearAllMocks();
  mockBroadcastLogic.mockResolvedValue(TXID);
  mockGetWalletAccount.mockReturnValue({
    xpub: { explorer: { fetchUtxoTx } },
  } as unknown as ReturnType<typeof getWalletAccount>);
});

describe("broadcast", () => {
  it("patches the operation with the returned txid", async () => {
    const operation = await submit({ zcashShielded: true });

    expect(operation.hash).toBe(TXID);
  });

  it("passes the operation's outpoints and the account's explorer to the guard", async () => {
    const inputRefs = [{ hash: PREVOUT_HASH, outputIndex: 0, address: "t1abc" }];

    await submit({ zcashShielded: true, inputs: [`${PREVOUT_HASH}-0`], inputRefs });

    expect(mockBroadcastLogic).toHaveBeenCalledWith(TX_HEX, {
      inputRefs,
      fetchUtxoTx: expect.any(Function),
    });

    const { fetchUtxoTx: forwarded } = mockBroadcastLogic.mock.calls[0][1]!;
    await forwarded(PREVOUT_HASH);
    expect(fetchUtxoTx).toHaveBeenCalledWith(PREVOUT_HASH);
  });

  it("passes no guard context for a fully shielded send", async () => {
    await submit({ zcashShielded: true });

    expect(mockBroadcastLogic).toHaveBeenCalledWith(TX_HEX, undefined);
    expect(mockGetWalletAccount).not.toHaveBeenCalled();
  });
});
