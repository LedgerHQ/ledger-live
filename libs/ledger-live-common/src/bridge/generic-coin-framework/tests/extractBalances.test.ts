import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { buildOptimisticOperation, extractBalances } from "../utils";
import type { GenericTransaction } from "../types";

const account = {
  balance: new BigNumber(10_000),
  spendableBalance: new BigNumber(10_000),
  freshAddress: "owner",
  stakingResources: {
    delegations: [
      {
        positionId: "stake-acc-1",
        validatorAddress: "vote-acc",
        amount: new BigNumber(1_000),
        pendingRewards: new BigNumber(0),
        status: "bonded",
        activeAmount: new BigNumber(1_000),
        lockedReserve: new BigNumber(2_282_880),
        canStake: true,
        canWithdraw: true,
      },
    ],
    unbondings: [
      {
        positionId: "stake-acc-2",
        validatorAddress: "",
        amount: new BigNumber(500),
        completionDate: new Date(0),
        status: "withdrawable",
        canWithdraw: false,
      },
    ],
  },
} as unknown as Account;

describe("buildOptimisticOperation memo", () => {
  const account = {
    id: "js:2:solana:xpub:",
    freshAddress: "sender",
    currency: { units: [{ magnitude: 9 }] },
  } as unknown as Account;

  it("shows the memo the user typed on a pending transfer", () => {
    const op = buildOptimisticOperation(account, {
      family: "solana",
      mode: "send",
      recipient: "dest",
      amount: new BigNumber(1),
      memoType: "TEXT",
      memoValue: "memo123",
    } as unknown as GenericTransaction);

    expect(op.extra).toMatchObject({ memo: "memo123" });
  });

  // Solana carries the stake account in the memo field when delegating; that is not a user memo.
  it("leaves the memo out of a staking operation", () => {
    const op = buildOptimisticOperation(account, {
      family: "solana",
      mode: "delegate",
      recipient: "vote-acc",
      amount: new BigNumber(0),
      memoType: "STAKE_ACCOUNT",
      memoValue: "stake-acc",
    } as unknown as GenericTransaction);

    expect(op.extra).not.toHaveProperty("memo");
  });
});

describe("extractBalances", () => {
  // Staking flows validate against these balances; dropping the positions makes every one of them
  // report the stake account as unknown.
  it("reconstructs the staking positions the account carries", () => {
    const [native, delegation, unbonding] = extractBalances(account);

    expect(native.stake).toBeUndefined();
    expect(native.value).toBe(10_000n);

    expect(delegation.stake).toMatchObject({
      uid: "stake-acc-1",
      state: "active",
      delegate: "vote-acc",
      amount: 1_000n,
      details: { activeAmount: 1_000, lockedReserve: 2_282_880, canStake: true, canWithdraw: true },
    });

    expect(unbonding.stake).toMatchObject({ uid: "stake-acc-2", state: "withdrawable" });
    // An unbonding with no validator leaves `delegate` unset rather than empty.
    expect(unbonding.stake?.delegate).toBeUndefined();
  });

  it("returns only the native balance for an account with no staking resources", () => {
    expect(extractBalances({ ...account, stakingResources: undefined } as Account)).toHaveLength(1);
  });
});
