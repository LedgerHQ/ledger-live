import { Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionStatus } from "../types";
import { createTransaction } from "./createTransaction";
import getDeviceTransactionConfig from "./deviceTransactionConfig";

const POOL = "SP000000000000000000002Q6VF78.native-pool-signer-manager";

const fieldsFor = (overrides: Partial<Transaction>) =>
  getDeviceTransactionConfig({
    account: {} as AccountLike,
    parentAccount: {} as Account,
    transaction: { ...createTransaction({} as AccountLike<Account>), ...overrides },
    status: {} as TransactionStatus,
  });

describe("getDeviceTransactionConfig", () => {
  it("shows the recipient, nonce and memo of a transfer", async () => {
    expect(
      await fieldsFor({ recipient: "SP_RECIPIENT", nonce: new BigNumber(3), memo: "hello" }),
    ).toEqual([
      { type: "address", label: "Recipient", address: "SP_RECIPIENT" },
      { type: "text", label: "Nonce", value: "3" },
      { type: "stacks.memo", label: "Memo", value: "hello" },
    ]);
  });

  it("shows the pool, amount and number of cycles of a stake, without recipient or memo", async () => {
    expect(
      await fieldsFor({
        mode: "delegate",
        valAddress: POOL,
        amount: new BigNumber(1000),
        familySpecificData: { numCycles: 12 },
        nonce: new BigNumber(0),
      }),
    ).toEqual([
      { type: "address", label: "Pool", address: POOL },
      { type: "amount", label: "Amount" },
      { type: "text", label: "Number of cycles", value: "12" },
      { type: "text", label: "Nonce", value: "0" },
    ]);
  });

  it("shows the pool of an unstake, without recipient, amount or memo", async () => {
    expect(
      await fieldsFor({ mode: "undelegate", valAddress: POOL, nonce: new BigNumber(4) }),
    ).toEqual([
      { type: "address", label: "Pool", address: POOL },
      { type: "text", label: "Nonce", value: "4" },
    ]);
  });
});
