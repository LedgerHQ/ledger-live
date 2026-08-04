import type { TX } from "@ledgerhq/wallet-btc/index";

// ── Mock: the lazily-imported ZCash client module ──────────────────────────
// The client shape is what decides whether the chain can be asked at all: the
// React Native stub omits `transactionDetails` entirely rather than defining
// one that throws.

const mockTransactionDetails = jest.fn();
const mockClient: { transactionDetails?: jest.Mock } = {};
const mockCreateZCashClient = jest.fn().mockReturnValue(mockClient);

jest.mock("@ledgerhq/coin-bitcoin/chain-adapters/zcash/ZCash", () => ({
  createZCashClient: mockCreateZCashClient,
}));

jest.mock("@ledgerhq/live-signer-zcash", () => ({
  DmkSignerZcash: jest.fn(),
}));

// Load the adapter (side-effect registers it under 'zcash')
import "../index";
import { getChainAdapter } from "../../registry";
import { setZcashShieldedEnabled } from "../constants";
import { clearTransactionDetailsCache } from "../transaction-details";
import type { ZcashAccount } from "../types";
import type { BitcoinAccount } from "../../../types";

const adapter = getChainAdapter("zcash");

const transaction = {
  id: "76ec3b38",
  block: { height: 3_426_175, hash: "blockhash", time: "2026-07-26T12:00:00Z" },
  inputs: [{ value: "6191914", output_hash: "2a84cff0", output_index: 0, sequence: 0 }],
  outputs: [],
  fees: 10_055_000,
} as unknown as TX;

const account = { privateInfo: { ufvk: "uview1account" } } as unknown as ZcashAccount;

beforeEach(() => {
  jest.clearAllMocks();
  clearTransactionDetailsCache();
  setZcashShieldedEnabled(true);
  delete mockClient.transactionDetails;
});

afterAll(() => setZcashShieldedEnabled(false));

describe("resolveTransactionDetails", () => {
  it("asks the chain with the account's viewing key", async () => {
    mockClient.transactionDetails = mockTransactionDetails.mockResolvedValue([
      { txid: "76ec3b38", fee: "55000", payees: ["u1recipient"] },
    ]);

    const resolved = await adapter.resolveTransactionDetails?.(
      [transaction],
      account as unknown as BitcoinAccount,
    );

    expect(mockTransactionDetails).toHaveBeenCalledWith(
      [
        {
          txid: "76ec3b38",
          height: 3_426_175,
          prevouts: [{ txid: "2a84cff0", index: 0, value: "6191914" }],
        },
      ],
      "uview1account",
    );
    expect(resolved?.transactions[0].fees).toBe(55_000);
    expect(resolved?.payeesByTxId.get("76ec3b38")).toEqual(["u1recipient"]);
  });

  // The capability is settled for the whole platform, so a client without it is
  // not asked at all — rather than asked in vain on every sync pass.
  it("leaves the explorer's view alone when the platform cannot answer", async () => {
    const resolved = await adapter.resolveTransactionDetails?.(
      [transaction],
      account as unknown as BitcoinAccount,
    );

    expect(mockTransactionDetails).not.toHaveBeenCalled();
    expect(resolved?.transactions[0].fees).toBe(10_055_000);
    expect(resolved?.payeesByTxId.size).toBe(0);
  });

  it("does not reach for a client at all while shielded support is off", async () => {
    setZcashShieldedEnabled(false);

    const resolved = await adapter.resolveTransactionDetails?.([transaction], undefined);

    expect(mockCreateZCashClient).not.toHaveBeenCalled();
    expect(resolved?.transactions).toEqual([transaction]);
  });
});
