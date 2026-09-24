jest.mock("@ledgerhq/ledger-wallet-framework/account/index");
jest.mock("./getTransactionStatus");

import type { DeepPartial, DeepPartialReturn } from "@ledgerhq/coin-module-framework/test/utils";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { BigNumber } from "bignumber.js";
import { KaspaAccount, KaspaUtxo, Transaction } from "../types";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getCachedUtxos } from "./getTransactionStatus";

const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedGetCachedUtxos = jest.mocked<DeepPartialReturn<typeof getCachedUtxos>>(getCachedUtxos);

const SCHNORR_RECIPIENT = "kaspa:qrp78nf43jaz3zk0j4dxga4ncdzk95xhun95hp6scyh6g6z7kwugy02wfw6ee";
const ECDSA_RECIPIENT = "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65";

const generateUtxoSet = (
  count: number,
  amount: BigNumber,
  startBlockDaaScore: string,
): KaspaUtxo[] =>
  Array.from(
    { length: count },
    (_, i) =>
      ({
        address: SCHNORR_RECIPIENT,
        outpoint: { transactionId: i.toString(16).padStart(64, "0"), index: i },
        utxoEntry: {
          amount,
          scriptPublicKey: { version: 0, scriptPublicKey: "" },
          blockDaaScore: (Number(startBlockDaaScore) + i).toString(),
          isCoinbase: true,
        },
        accountType: 0,
        accountIndex: 0,
      }) as KaspaUtxo,
  );

const mockAccount: DeepPartial<KaspaAccount> = {
  id: "mock_kaspa_account",
  xpub: "mock_xpub",
};

const baseTransaction: DeepPartial<Transaction> = {
  family: "kaspa",
  recipient: SCHNORR_RECIPIENT,
  feesStrategy: "custom",
  customFeeRate: new BigNumber(1),
};

describe("estimateMaxSpendable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetMainAccount.mockReturnValue(mockAccount as KaspaAccount);
  });

  it("computes max spendable from the account's UTXOs when there are fewer than the 88-UTXO-per-tx limit", async () => {
    const utxos = generateUtxoSet(5, new BigNumber(1_0000_0000), "12345");
    mockedGetCachedUtxos.mockResolvedValue({ utxos });

    const result = await estimateMaxSpendable({
      account: mockAccount as KaspaAccount,
      parentAccount: undefined,
      transaction: baseTransaction as Transaction,
    });

    expect(result.toNumber()).toBe(5_0000_0000 - 5 * 1118 - 506);
  });

  it("caps spendable amount to the 88-UTXO-per-tx limit when the account has more UTXOs than that", async () => {
    const utxos = generateUtxoSet(100, new BigNumber(1_0000_0000), "12345");
    mockedGetCachedUtxos.mockResolvedValue({ utxos });

    const result = await estimateMaxSpendable({
      account: mockAccount as KaspaAccount,
      parentAccount: undefined,
      transaction: baseTransaction as Transaction,
    });

    const cappedExpected = 88 * 1_0000_0000 - 88 * 1118 - 506;
    const oldBuggyFormula = 100 * 1_0000_0000 - 506 - 1118;

    expect(result.toNumber()).toBe(cappedExpected);
    expect(result.toNumber()).toBeLessThan(oldBuggyFormula);
  });

  it("deducts the extra ECDSA-recipient mass penalty", async () => {
    const utxos = generateUtxoSet(5, new BigNumber(1_0000_0000), "12345");
    mockedGetCachedUtxos.mockResolvedValue({ utxos });

    const result = await estimateMaxSpendable({
      account: mockAccount as KaspaAccount,
      parentAccount: undefined,
      transaction: { ...baseTransaction, recipient: ECDSA_RECIPIENT } as Transaction,
    });

    expect(result.toNumber()).toBe(5_0000_0000 - 5 * 1118 - 506 - 11);
  });

  it("treats a missing transaction as the worst case (ECDSA) and does not throw", async () => {
    const utxos = generateUtxoSet(5, new BigNumber(1_0000_0000), "12345");
    mockedGetCachedUtxos.mockResolvedValue({ utxos });

    const result = await estimateMaxSpendable({
      account: mockAccount as KaspaAccount,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(result.toNumber()).toBe(5_0000_0000 - 5 * 1118 - 506 - 11);
  });

  it("resolves to zero instead of rejecting when fetching UTXOs fails", async () => {
    mockedGetCachedUtxos.mockRejectedValue(new Error("indexer unavailable"));

    const result = await estimateMaxSpendable({
      account: mockAccount as KaspaAccount,
      parentAccount: undefined,
      transaction: baseTransaction as Transaction,
    });

    expect(result.toNumber()).toBe(0);
  });

  it("resolves the main account via getMainAccount before fetching UTXOs", async () => {
    const parentAccount: DeepPartial<KaspaAccount> = {
      id: "parent_kaspa_account",
      xpub: "parent_xpub",
    };
    mockedGetMainAccount.mockReturnValue(parentAccount as KaspaAccount);
    mockedGetCachedUtxos.mockResolvedValue({ utxos: [] });

    await estimateMaxSpendable({
      account: mockAccount as KaspaAccount,
      parentAccount: undefined,
      transaction: baseTransaction as Transaction,
    });

    expect(mockedGetCachedUtxos).toHaveBeenCalledWith(parentAccount);
  });
});
