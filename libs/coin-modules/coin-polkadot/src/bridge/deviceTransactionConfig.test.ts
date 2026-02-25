/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { PolkadotAccount, Transaction, TransactionStatus } from "../types";
import getDeviceTransactionConfig from "./deviceTransactionConfig";

// Module-level mocks
const mockGetMainAccount = jest.fn();
jest.mock("@ledgerhq/coin-framework/account", () => ({
  ...jest.requireActual("@ledgerhq/coin-framework/account"),
  getMainAccount: (...args: unknown[]) => mockGetMainAccount(...args),
}));

const mockIsStash = jest.fn();
jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  isStash: (...args: unknown[]) => mockIsStash(...args),
}));

describe("getDeviceTransactionConfig", () => {
  const status = {
    amount: new BigNumber(1),
  } as unknown as TransactionStatus;

  beforeAll(() => {
    mockGetMainAccount.mockReturnValue({} as PolkadotAccount);
  });

  beforeEach(() => {
    mockIsStash.mockReset();
  });

  it("should correct config for send when transaction is full amount", async () => {
    const fields = await getDeviceTransactionConfig({
      account: {} as AccountLike,
      parentAccount: null,
      transaction: { mode: "send", useAllAmount: true } as Transaction,
      status,
    });

    expect(fields).toEqual([
      {
        label: "Balances",
        type: "text",
        value: "Transfer",
      },
      {
        label: "Amount",
        type: "amount",
        value: "0.0000000001 DOT",
      },
      {
        label: "Fees",
        type: "fees",
      },
    ]);
  });

  it("should correct config for send when transaction is not full amount", async () => {
    const fields = await getDeviceTransactionConfig({
      account: {} as AccountLike,
      parentAccount: null,
      transaction: { mode: "send" } as Transaction,
      status,
    });

    expect(fields).toEqual([
      {
        label: "Balances",
        type: "text",
        value: "Transfer keep alive",
      },
      {
        label: "Amount",
        type: "amount",
        value: "0.0000000001 DOT",
      },
      {
        label: "Fees",
        type: "fees",
      },
    ]);
  });

  it("should correct config for nominate", async () => {
    const fields = await getDeviceTransactionConfig({
      account: {} as AccountLike,
      parentAccount: null,
      transaction: { mode: "nominate" } as Transaction,
      status,
    });

    expect(fields).toEqual([
      {
        label: "Staking",
        type: "text",
        value: "Nominate",
      },
      {
        label: "Targets",
        type: "polkadot.validators",
      },
      {
        label: "Fees",
        type: "fees",
      },
    ]);
  });

  it("should correct config for bond when account is a stash", async () => {
    mockIsStash.mockReturnValueOnce(true);

    const fields = await getDeviceTransactionConfig({
      account: {} as AccountLike,
      parentAccount: null,
      transaction: { mode: "bond" } as Transaction,
      status,
    });

    expect(fields).toEqual([
      {
        label: "Staking",
        type: "text",
        value: "Bond extra",
      },
      {
        label: "Amount",
        type: "text",
        value: "0.0000000001 DOT",
      },
      {
        label: "Fees",
        type: "fees",
      },
    ]);
  });

  it("should correct config for bond when account is not a stash", async () => {
    mockIsStash.mockReturnValueOnce(false);

    const fields = await getDeviceTransactionConfig({
      account: {} as AccountLike,
      parentAccount: null,
      transaction: { mode: "bond" } as Transaction,
      status,
    });

    expect(fields).toEqual([
      {
        label: "Staking",
        type: "text",
        value: "Bond",
      },
      {
        label: "Amount",
        type: "text",
        value: "0.0000000001 DOT",
      },
      {
        label: "Payee",
        type: "text",
        value: "Stash",
      },
      {
        label: "Fees",
        type: "fees",
      },
    ]);
  });

  it("should correct config for rebond", async () => {
    const fields = await getDeviceTransactionConfig({
      account: {} as AccountLike,
      parentAccount: null,
      transaction: { mode: "rebond" } as Transaction,
      status,
    });

    expect(fields).toEqual([
      {
        label: "Staking",
        type: "text",
        value: "Rebond",
      },
      {
        label: "Amount",
        type: "text",
        value: "0.0000000001 DOT",
      },
      {
        label: "Fees",
        type: "fees",
      },
    ]);
  });

  it("should correct config for unbond", async () => {
    const fields = await getDeviceTransactionConfig({
      account: {} as AccountLike,
      parentAccount: null,
      transaction: { mode: "unbond" } as Transaction,
      status,
    });

    expect(fields).toEqual([
      {
        label: "Staking",
        type: "text",
        value: "Unbond",
      },
      {
        label: "Amount",
        type: "text",
        value: "0.0000000001 DOT",
      },
      {
        label: "Fees",
        type: "fees",
      },
    ]);
  });

  it("should correct config for chill", async () => {
    const fields = await getDeviceTransactionConfig({
      account: {} as AccountLike,
      parentAccount: null,
      transaction: { mode: "chill" } as Transaction,
      status,
    });

    expect(fields).toEqual([
      {
        label: "Staking",
        type: "text",
        value: "Chill",
      },
      {
        label: "Fees",
        type: "fees",
      },
    ]);
  });

  it("should correct config for withdrawUnbonded", async () => {
    const fields = await getDeviceTransactionConfig({
      account: {} as AccountLike,
      parentAccount: null,
      transaction: { mode: "withdrawUnbonded" } as Transaction,
      status,
    });

    expect(fields).toEqual([
      {
        label: "Staking",
        type: "text",
        value: "Withdraw Unbonded",
      },
      {
        label: "Fees",
        type: "fees",
      },
    ]);
  });

  it("should correct config for setController", async () => {
    const fields = await getDeviceTransactionConfig({
      account: {} as AccountLike,
      parentAccount: null,
      transaction: { mode: "setController" } as Transaction,
      status,
    });

    expect(fields).toEqual([
      {
        label: "Staking",
        type: "text",
        value: "Set controller",
      },
      {
        label: "Fees",
        type: "fees",
      },
    ]);
  });

  it("should correct config for claimReward", async () => {
    const fields = await getDeviceTransactionConfig({
      account: {} as AccountLike,
      parentAccount: null,
      transaction: { mode: "claimReward" } as Transaction,
      status,
    });

    expect(fields).toEqual([
      {
        label: "Staking",
        type: "text",
        value: "Payout Stakers",
      },
      {
        label: "Fees",
        type: "fees",
      },
    ]);
  });

  it("should correct config for an unknown/random mode", async () => {
    const fields = await getDeviceTransactionConfig({
      account: {} as AccountLike,
      parentAccount: null,
      transaction: { mode: "some random and unknown mode" } as unknown as Transaction,
      status,
    });

    expect(fields).toEqual([
      {
        label: "Fees",
        type: "fees",
      },
    ]);
  });
});
