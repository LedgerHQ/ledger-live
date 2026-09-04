/**
 * The bridge's job at broadcast time is to hand the guard its context: the
 * outpoints the signing recorded on the operation, and the account's explorer.
 * The guard itself is covered in logic/transaction/broadcast.unit.test.ts.
 */
import { log } from "@ledgerhq/logs";
import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { broadcast } from "./broadcast";
import { getWalletAccount } from "./getWalletAccount";
import { broadcast as broadcastLogic } from "../logic/transaction/broadcast";
import {
  reserveNotes,
  getSessionReservedNullifiers,
  _resetReservationsForTest,
} from "./note-reservation";
import type { ZcashAccount, ZcashOperationExtra } from "../types/bridge";

jest.mock("./getWalletAccount");
jest.mock("../logic/transaction/broadcast");
jest.mock("@ledgerhq/logs", () => ({ log: jest.fn() }));

const mockGetWalletAccount = getWalletAccount as jest.MockedFunction<typeof getWalletAccount>;
const mockBroadcastLogic = broadcastLogic as jest.MockedFunction<typeof broadcastLogic>;
const mockLog = log as jest.MockedFunction<typeof log>;

const TXID = "cc".repeat(32);
const PREVOUT_HASH = "ab".repeat(32);
const TX_HEX = "05" + "00".repeat(63);

const fetchUtxoTx = jest.fn();
const account = { id: "js:2:zcash:xpub:", currency: { id: "zcash" } } as unknown as ZcashAccount;

const submit = (extra: ZcashOperationExtra, hash = "") =>
  broadcast({
    account,
    signedOperation: {
      signature: TX_HEX,
      operation: { id: "op1", hash, extra } as unknown as Operation,
    } as SignedOperation,
  });

beforeEach(() => {
  jest.clearAllMocks();
  _resetReservationsForTest();
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

  // Signing reserves the notes it spends. A send that never reached the network
  // cannot spend them, and the user is about to retry with those very notes.
  describe("note reservations", () => {
    const NULLIFIER = "11".repeat(32);

    it("hands the reserved notes back when the send does not go out", async () => {
      reserveNotes(account.id, TXID, [NULLIFIER]);
      mockBroadcastLogic.mockRejectedValue(new Error("network down"));

      await expect(submit({ zcashShielded: true }, TXID)).rejects.toThrow("network down");

      expect(getSessionReservedNullifiers(account.id).size).toBe(0);
      expect(mockLog).toHaveBeenCalledWith(
        "zcash",
        "released note reservation after broadcast failure",
        { accountId: account.id, operationHash: TXID },
      );
    });

    it("keeps them reserved once the send is out", async () => {
      reserveNotes(account.id, TXID, [NULLIFIER]);

      await submit({ zcashShielded: true }, TXID);

      expect(getSessionReservedNullifiers(account.id).has(NULLIFIER)).toBe(true);
    });
  });
});
