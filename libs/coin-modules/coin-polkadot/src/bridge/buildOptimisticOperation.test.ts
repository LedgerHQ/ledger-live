/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { PolkadotAccount, Transaction } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

describe("buildOptimisticOperation", () => {
  it.each([
    { mode: "send", type: "OUT" },
    { mode: "bond", type: "BOND" },
    { mode: "unbond", type: "UNBOND" },
    { mode: "rebond", type: "BOND" },
    { mode: "withdrawUnbonded", type: "WITHDRAW_UNBONDED" },
    { mode: "nominate", type: "NOMINATE" },
    { mode: "chill", type: "CHILL" },
    { mode: "setController", type: "SET_CONTROLLER" },
    { mode: "claimReward", type: "REWARD_PAYOUT" },
    { mode: "default", type: "FEES" },
  ])("should build correctly an operation $type from a $mode transaction", ({ mode, type }) => {
    const account = {
      id: "random-account-id",
      freshAddress: "some random address",
      polkadotResources: {
        nonce: 1,
      },
      pendingOperations: [
        {
          transactionSequenceNumber: new BigNumber(1),
        },
      ],
    } as PolkadotAccount;
    const transaction = {
      mode,
      amount: BigNumber(2),
      recipient: "some random recipient",
    } as Transaction;

    const fee = BigNumber(1);
    const beforeBuildDate = new Date();
    const operation = buildOptimisticOperation(account, transaction, fee);
    const afterBuildDate = new Date();

    expect(operation).toEqual({
      id: `${account.id}--${type}`,
      hash: "",
      type,
      value: type === "OUT" ? transaction.amount.plus(fee) : fee,
      fee,
      blockHash: null,
      blockHeight: null,
      senders: [account.freshAddress],
      recipients: [transaction.recipient].filter(Boolean),
      accountId: account.id,
      transactionSequenceNumber: account.pendingOperations[0].transactionSequenceNumber!.plus(1),
      date: expect.any(Date),
      extra: expect.any(Object),
    });

    expect(operation.date.getTime()).toBeGreaterThanOrEqual(beforeBuildDate.getTime());
    expect(operation.date.getTime()).toBeLessThanOrEqual(afterBuildDate.getTime());
  });

  it("should build correctly the extra on an OUT operation when using all amount", () => {
    const account = {
      pendingOperations: [
        {
          transactionSequenceNumber: new BigNumber(0),
        },
      ],
    } as PolkadotAccount;
    const transaction = {
      mode: "send",
      amount: BigNumber(1),
      useAllAmount: true,
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.extra).toEqual({
      index: 0,
      palletMethod: "balances.transferAllowDeath",
      transferAmount: transaction.amount,
    });
  });

  it("should build correctly the extra on an OUT operation when not using all amount", () => {
    const account = {
      pendingOperations: [
        {
          transactionSequenceNumber: new BigNumber(0),
        },
      ],
    } as PolkadotAccount;
    const transaction = {
      mode: "send",
      amount: BigNumber(1),
      useAllAmount: false,
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.extra).toEqual({
      index: 0,
      palletMethod: "balances.transferKeepAlive",
      transferAmount: transaction.amount,
    });
  });

  it("should build correctly the extra on an BOND operation when account is a Stash", () => {
    const account = {
      polkadotResources: {
        controller: "some random controller",
      },
      pendingOperations: [
        {
          transactionSequenceNumber: new BigNumber(0),
        },
      ],
    } as PolkadotAccount;
    const transaction = {
      mode: "bond",
      amount: BigNumber(1),
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.extra).toEqual({
      index: 0,
      palletMethod: "staking.bondExtra",
      bondedAmount: transaction.amount,
    });
  });

  it("should build correctly the extra on an BOND operation when account is not a Stash", () => {
    const account = {
      pendingOperations: [
        {
          transactionSequenceNumber: new BigNumber(0),
        },
      ],
    } as PolkadotAccount;
    const transaction = {
      mode: "bond",
      amount: BigNumber(1),
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.extra).toEqual({
      index: 0,
      palletMethod: "staking.bond",
      bondedAmount: transaction.amount,
    });
  });

  it("should build correctly the extra on an UNBOND operation", () => {
    const account = {
      pendingOperations: [
        {
          transactionSequenceNumber: new BigNumber(0),
        },
      ],
    } as PolkadotAccount;
    const transaction = {
      mode: "unbond",
      amount: BigNumber(1),
      useAllAmount: false,
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.extra).toEqual({
      index: 0,
      palletMethod: "staking.unbond",
      unbondedAmount: transaction.amount,
    });
  });

  it("should build correctly the extra on an WITHDRAW_UNBONDED operation when account have an unlocked balance", () => {
    const account = {
      polkadotResources: {
        unlockedBalance: BigNumber(1),
      },
      pendingOperations: [
        {
          transactionSequenceNumber: new BigNumber(0),
        },
      ],
    } as PolkadotAccount;
    const transaction = {
      mode: "withdrawUnbonded",
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.extra).toEqual({
      index: 0,
      palletMethod: "staking.withdrawUnbonded",
      withdrawUnbondedAmount: account.polkadotResources.unlockedBalance,
    });
  });

  it("should build correctly the extra on an WITHDRAW_UNBONDED operation when account dont have an unlocked balance", () => {
    const account = {
      pendingOperations: [
        {
          transactionSequenceNumber: new BigNumber(0),
        },
      ],
    } as PolkadotAccount;
    const transaction = {
      mode: "withdrawUnbonded",
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.extra).toEqual({
      index: 0,
      palletMethod: "staking.withdrawUnbonded",
      withdrawUnbondedAmount: BigNumber(0),
    });
  });

  it("should build correctly the extra on an NOMINATE operation", () => {
    const account = {
      pendingOperations: [
        {
          transactionSequenceNumber: new BigNumber(0),
        },
      ],
    } as PolkadotAccount;
    const transaction = {
      mode: "nominate",
      validators: ["some random validator", "some random validator 2"],
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.extra).toEqual({
      index: 0,
      palletMethod: "staking.nominate",
      validators: transaction.validators,
    });
  });

  it("should build correctly the nonce on an OUT operation when account nonce is bigger than transaction sequence number of last operation account", () => {
    const account = {
      polkadotResources: {
        nonce: Infinity,
      },
      pendingOperations: [
        {
          transactionSequenceNumber: new BigNumber(0),
        },
      ],
    } as PolkadotAccount;
    const transaction = {
      mode: "send",
      amount: BigNumber(1),
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.transactionSequenceNumber?.toNumber()).toEqual(
      account.polkadotResources.nonce,
    );
  });

  it("should build correctly the nonce on an OUT operation when account nonce is bigger than 0 and account has no operations", () => {
    const account = {
      polkadotResources: {
        nonce: 1,
      },
      pendingOperations: [] as unknown as Operation[],
    } as PolkadotAccount;
    const transaction = {
      mode: "send",
      amount: BigNumber(1),
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.transactionSequenceNumber?.toNumber()).toEqual(
      account.polkadotResources.nonce,
    );
  });

  it("should build correctly the nonce on an OUT operation when account nonce is bigger than 0 and transaction sequence number of last operation account is not a number", () => {
    const account = {
      polkadotResources: {
        nonce: 1,
      },
      pendingOperations: [
        {
          transactionSequenceNumber: new BigNumber("random string"),
        },
      ] as unknown as Operation[],
    } as PolkadotAccount;
    const transaction = {
      mode: "send",
      amount: BigNumber(1),
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.transactionSequenceNumber?.toNumber()).toEqual(
      account.polkadotResources.nonce,
    );
  });

  it("should build correctly the nonce on an OUT operation when account has no nonce and account has no operations", () => {
    const account = {
      pendingOperations: [] as unknown as Operation[],
    } as PolkadotAccount;
    const transaction = {
      mode: "send",
      amount: BigNumber(1),
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.transactionSequenceNumber?.toNumber()).toEqual(0);
  });

  it("should build correctly the nonce on an OUT operation when transaction sequence number of last pending operation is bigger than 0", () => {
    const account = {
      pendingOperations: [
        {
          transactionSequenceNumber: new BigNumber(1),
        },
      ],
    } as PolkadotAccount;
    const transaction = {
      mode: "send",
      amount: BigNumber(1),
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.transactionSequenceNumber).toEqual(
      account.pendingOperations[0].transactionSequenceNumber!.plus(1),
    );
  });

  it("should build correctly the nonce on an OUT operation when transaction sequence number of last pending operation is bigger than account nonce", () => {
    const account = {
      polkadotResources: {
        nonce: 1,
      },
      pendingOperations: [
        {
          transactionSequenceNumber: new BigNumber(2),
        },
      ],
    } as PolkadotAccount;
    const transaction = {
      mode: "send",
      amount: BigNumber(1),
    } as Transaction;

    const fee = BigNumber(0);
    const operation = buildOptimisticOperation(account, transaction, fee);
    expect(operation.transactionSequenceNumber).toEqual(
      account.pendingOperations[0].transactionSequenceNumber!.plus(1),
    );
  });
});
