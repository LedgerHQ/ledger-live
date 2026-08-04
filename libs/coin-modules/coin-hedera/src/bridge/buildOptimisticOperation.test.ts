import BigNumber from "bignumber.js";
import { HEDERA_TRANSACTION_MODES } from "../constants";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import {
  getMockedERC20TokenCurrency,
  getMockedHTSTokenCurrency,
} from "../test/fixtures/currency.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

describe("buildOptimisticOperation", () => {
  it("builds optimistic operation for token association", async () => {
    const mockedAccount = getMockedAccount();
    const mockedToken = getMockedHTSTokenCurrency();
    const mockedTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
      amount: new BigNumber(0),
      recipient: "0.0.1234",
      maxFee: new BigNumber(1000),
      properties: {
        token: mockedToken,
      },
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("ASSOCIATE_TOKEN");
    expect(op.extra).toEqual({ associatedTokenId: mockedToken.contractAddress });
    expect(op.fee).toEqual(mockedTransaction.maxFee);
    expect(op.senders).toContain(mockedAccount.freshAddress);
    expect(op.recipients).toContain("0.0.1234");
  });

  it("builds optimistic operation for coin", async () => {
    const mockedAccount = getMockedAccount();
    const mockedTransaction = getMockedTransaction({
      amount: new BigNumber(123),
      recipient: "0.0.5678",
      maxFee: new BigNumber(1500),
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("OUT");
    expect(op.fee).toEqual(mockedTransaction.maxFee);
    expect(op.value).toEqual(new BigNumber(123));
    expect(op.senders).toContain(mockedAccount.freshAddress);
    expect(op.recipients).toContain("0.0.5678");
  });

  it.each([
    ["HTS", getMockedHTSTokenCurrency, new BigNumber(2000)],
    ["ERC20", getMockedERC20TokenCurrency, new BigNumber(2500)],
  ] as const)("builds optimistic operation for %s token", async (_, getMockedCurrency, maxFee) => {
    const mockedTokenCurrency = getMockedCurrency();
    const tokenAccount = getMockedTokenAccount(mockedTokenCurrency);
    const parentAccount = getMockedAccount({ subAccounts: [tokenAccount] });
    const mockedTransaction = getMockedTransaction({
      subAccountId: tokenAccount.id,
      amount: new BigNumber(123),
      recipient: "0.0.9999",
      maxFee,
    });

    const op = await buildOptimisticOperation({
      account: parentAccount,
      transaction: mockedTransaction,
    });
    const subOp = (op.subOperations ?? [])[0];

    expect(op.type).toBe("FEES");
    expect(op.value).toEqual(maxFee);
    expect(op.subOperations).toHaveLength(1);
    expect(subOp.type).toBe("OUT");
    expect(subOp.value).toEqual(new BigNumber(123));
    expect(subOp.fee).toEqual(maxFee);
    expect(subOp.accountId).toBe(tokenAccount.id);
    expect(subOp.recipients).toContain("0.0.9999");
  });

  it.each([
    ["HTS", getMockedHTSTokenCurrency, "HTS transfer with memo"],
    ["ERC20", getMockedERC20TokenCurrency, "ERC20 transfer with memo"],
  ] as const)(
    "includes memo in %s token sub-operation extra when memo is set",
    async (_, getMockedCurrency, memo) => {
      const mockedTokenCurrency = getMockedCurrency();
      const tokenAccount = getMockedTokenAccount(mockedTokenCurrency);
      const parentAccount = getMockedAccount({ subAccounts: [tokenAccount] });
      const mockedTransaction = getMockedTransaction({
        subAccountId: tokenAccount.id,
        amount: new BigNumber(50),
        recipient: "0.0.9999",
        maxFee: new BigNumber(1000),
        memo,
      });

      const op = await buildOptimisticOperation({
        account: parentAccount,
        transaction: mockedTransaction,
      });

      const subOp = (op.subOperations ?? [])[0];
      expect(subOp.extra).toEqual({ memo });
    },
  );

  it("builds optimistic operation for delegate transaction", async () => {
    const mockedAccount = getMockedAccount();
    const stakingNodeId = 5;
    const mockedTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Delegate,
      amount: new BigNumber(0),
      recipient: "",
      maxFee: new BigNumber(1200),
      properties: {
        stakingNodeId,
      },
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("DELEGATE");
    expect(op.fee).toEqual(mockedTransaction.maxFee);
    expect(op.value).toEqual(new BigNumber(0));
    expect(op.senders).toContain(mockedAccount.freshAddress);
    expect(op.extra).toEqual({
      memo: null,
      targetStakingNodeId: stakingNodeId,
      previousStakingNodeId: null,
    });
  });

  it("builds optimistic operation for redelegate transaction", async () => {
    const previousNodeId = 3;
    const newNodeId = 10;
    const mockedAccount = getMockedAccount({
      hederaResources: {
        isAutoTokenAssociationEnabled: false,
        maxAutomaticTokenAssociations: 0,
        delegation: {
          nodeId: previousNodeId,
          delegated: new BigNumber(1000000),
          pendingReward: new BigNumber(500),
        },
      },
    });
    const mockedTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Redelegate,
      amount: new BigNumber(0),
      recipient: "",
      maxFee: new BigNumber(1300),
      memo: "Redelegating to better validator",
      properties: {
        stakingNodeId: newNodeId,
      },
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("REDELEGATE");
    expect(op.fee).toEqual(mockedTransaction.maxFee);
    expect(op.extra).toEqual({
      memo: "Redelegating to better validator",
      targetStakingNodeId: newNodeId,
      previousStakingNodeId: previousNodeId,
    });
  });

  it("builds optimistic operation for undelegate transaction", async () => {
    const previousNodeId = 5;
    const mockedAccount = getMockedAccount({
      hederaResources: {
        isAutoTokenAssociationEnabled: false,
        maxAutomaticTokenAssociations: 0,
        delegation: {
          nodeId: previousNodeId,
          delegated: new BigNumber(2000000),
          pendingReward: new BigNumber(1000),
        },
      },
    });
    const mockedTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Undelegate,
      amount: new BigNumber(0),
      recipient: "",
      maxFee: new BigNumber(1100),
      properties: {
        stakingNodeId: null,
      },
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("UNDELEGATE");
    expect(op.fee).toEqual(mockedTransaction.maxFee);
    expect(op.value).toEqual(new BigNumber(0));
    expect(op.extra).toEqual({
      memo: null,
      targetStakingNodeId: null,
      previousStakingNodeId: previousNodeId,
    });
  });

  it("builds optimistic operation for claim rewards transaction", async () => {
    const stakingNodeId = 8;
    const mockedAccount = getMockedAccount({
      hederaResources: {
        isAutoTokenAssociationEnabled: false,
        maxAutomaticTokenAssociations: 0,
        delegation: {
          nodeId: stakingNodeId,
          delegated: new BigNumber(5000000),
          pendingReward: new BigNumber(2500),
        },
      },
    });
    const mockedTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.ClaimRewards,
      amount: new BigNumber(0),
      recipient: "",
      maxFee: new BigNumber(1400),
      memo: "Claiming staking rewards",
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("OUT");
    expect(op.fee).toEqual(mockedTransaction.maxFee);
    expect(op.extra).toEqual({
      memo: "Claiming staking rewards",
    });
  });
});
