import { Account, BlockhashWithExpiryBlockHeight } from "@solana/web3.js";
import { ChainAPI } from "./network";
import { prepareTransaction } from "./prepareTransaction";
import { SolanaAccount, Transaction } from "./types";
import BigNumber from "bignumber.js";

jest.mock("./estimateMaxSpendable", () => {
  const originalModule = jest.requireActual("./estimateMaxSpendable");

  return {
    __esModule: true,
    ...originalModule,
    estimateFeeAndSpendable: jest.fn(
      (_api: ChainAPI, _account: Account, _transaction?: Transaction | undefined | null) =>
        Promise.resolve({ fee: 0, spendable: BigNumber(0) }),
    ),
  };
});

describe("testing prepareTransaction", () => {
  it("should return the same raw transaction when user provide it", async () => {
    const rawTransaction = transaction("any random value");
    const preparedTransaction = await prepareTransaction(
      {} as SolanaAccount,
      rawTransaction,
      api(),
    );

    expect(preparedTransaction).toBe(rawTransaction);
    expect(preparedTransaction.raw).toEqual(rawTransaction.raw);
  });

  it("should return a new transaction when user does not provide a raw one", async () => {
    const nonRawTransaction = transaction();
    const preparedTransaction = await prepareTransaction(
      {} as SolanaAccount,
      nonRawTransaction,
      {} as ChainAPI,
    );

    expect(preparedTransaction).not.toBe(nonRawTransaction);
  });

  //TODO add more tests
});

function api() {
  return {
    getLatestBlockhash: () =>
      Promise.resolve({
        blockhash: "blockhash",
        lastValidBlockHeight: 1,
      } as BlockhashWithExpiryBlockHeight),
  } as ChainAPI;
}

function transaction(raw?: string): Transaction {
  return {
    amount: new BigNumber(0),
    model: {
      uiState: {},
      kind: "transfer",
    },
    raw: raw,
    family: "solana",
  } as Transaction;
}
