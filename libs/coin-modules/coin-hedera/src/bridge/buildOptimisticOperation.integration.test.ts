import BigNumber from "bignumber.js";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { HEDERA_OPERATION_TYPES, HEDERA_TRANSACTION_MODES } from "../constants";
import { estimateFees } from "../logic/estimateFees";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import {
  getMockedERC20TokenCurrency,
  getMockedHTSTokenCurrency,
} from "../test/fixtures/currency.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";

describe("buildOptimisticOperation", () => {
  it("builds optimistic operation for token association", async () => {
    const mockedAccount = getMockedAccount();
    const mockedToken = getMockedHTSTokenCurrency();
    const mockedTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
      amount: new BigNumber(0),
      recipient: "0.0.1234",
      properties: {
        token: mockedToken,
      },
    });

    const estimatedFee = await estimateFees({
      currency: mockedAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.TokenAssociate,
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("ASSOCIATE_TOKEN");
    expect(op.extra).toEqual({ associatedTokenId: mockedToken.contractAddress });
    expect(op.fee).toEqual(estimatedFee.tinybars);
    expect(op.senders).toContain(mockedAccount.freshAddress);
    expect(op.recipients).toContain("0.0.1234");
  });

  it("builds optimistic operation for coin", async () => {
    const mockedAccount = getMockedAccount();
    const mockedTransaction = getMockedTransaction({
      amount: new BigNumber(123),
      recipient: "0.0.5678",
    });

    const estimatedFee = await estimateFees({
      currency: mockedAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.CryptoTransfer,
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("OUT");
    expect(op.fee).toEqual(estimatedFee.tinybars);
    expect(op.value).toEqual(new BigNumber(123));
    expect(op.senders).toContain(mockedAccount.freshAddress);
    expect(op.recipients).toContain("0.0.5678");
  });

  it("builds optimistic operation for HTS token", async () => {
    const mockedAccount = getMockedAccount();
    const mockedTokenCurrency = getMockedHTSTokenCurrency();
    const tokenAccount = getMockedTokenAccount(mockedTokenCurrency);
    const parentAccount = getMockedAccount({ subAccounts: [tokenAccount] });
    const mockedTransaction = getMockedTransaction({
      subAccountId: tokenAccount.id,
      amount: new BigNumber(123),
      recipient: "0.0.9999",
    });

    const estimatedFee = await estimateFees({
      currency: mockedAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.TokenTransfer,
    });

    const op = await buildOptimisticOperation({
      account: parentAccount,
      transaction: mockedTransaction,
    });
    const subOp = (op.subOperations ?? [])[0];

    expect(op.type).toBe("FEES");
    expect(op.value).toEqual(estimatedFee.tinybars);
    expect(op.subOperations).toHaveLength(1);
    expect(subOp.type).toBe("OUT");
    expect(subOp.value).toEqual(new BigNumber(123));
    expect(subOp.fee).toEqual(estimatedFee.tinybars);
    expect(subOp.accountId).toBe(tokenAccount.id);
    expect(subOp.recipients).toContain("0.0.9999");
  });

  it("builds optimistic operation for ERC20 token", async () => {
    const mockedTokenCurrency = getMockedERC20TokenCurrency();
    const tokenAccount = getMockedTokenAccount(mockedTokenCurrency);
    const parentAccount = getMockedAccount({ subAccounts: [tokenAccount] });
    const mockedTransaction = getMockedTransaction({
      subAccountId: tokenAccount.id,
      amount: new BigNumber(123),
      recipient: "0.0.9999",
    });

    const estimatedFee = await estimateFees({
      operationType: HEDERA_OPERATION_TYPES.ContractCall,
      txIntent: {
        intentType: "transaction",
        type: HEDERA_TRANSACTION_MODES.Send,
        asset: {
          type: "erc20",
          assetReference: tokenAccount.token.contractAddress,
          assetOwner: parentAccount.freshAddress,
        },
        amount: BigInt(mockedTransaction.amount.toString()),
        sender: parentAccount.freshAddress,
        recipient: mockedTransaction.recipient,
      },
    });

    const op = await buildOptimisticOperation({
      account: parentAccount,
      transaction: mockedTransaction,
    });
    const subOp = (op.subOperations ?? [])[0];

    expect(op.type).toBe("FEES");
    expect(op.value).toEqual(estimatedFee.tinybars);
    expect(op.subOperations).toHaveLength(1);
    expect(subOp.type).toBe("OUT");
    expect(subOp.value).toEqual(new BigNumber(123));
    expect(subOp.fee).toEqual(estimatedFee.tinybars);
    expect(subOp.accountId).toBe(tokenAccount.id);
    expect(subOp.recipients).toContain("0.0.9999");
  });

  it("builds optimistic operation for delegate transaction", async () => {
    const mockedAccount = getMockedAccount();
    const stakingNodeId = 5;
    const mockedTransaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Delegate,
      amount: new BigNumber(0),
      recipient: "",
      properties: {
        stakingNodeId,
      },
    });

    const estimatedFee = await estimateFees({
      currency: mockedAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.CryptoUpdate,
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("UPDATE_ACCOUNT");
    expect(op.fee).toEqual(estimatedFee.tinybars);
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
      properties: {
        stakingNodeId: newNodeId,
      },
      memo: "Redelegating to better validator",
    });

    const estimatedFee = await estimateFees({
      currency: mockedAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.CryptoUpdate,
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("UPDATE_ACCOUNT");
    expect(op.fee).toEqual(estimatedFee.tinybars);
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
      properties: {
        stakingNodeId: null,
      },
    });

    const estimatedFee = await estimateFees({
      currency: mockedAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.CryptoUpdate,
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("UPDATE_ACCOUNT");
    expect(op.fee).toEqual(estimatedFee.tinybars);
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
      memo: "Claiming staking rewards",
    });

    const estimatedFee = await estimateFees({
      currency: mockedAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.CryptoTransfer,
    });

    const op = await buildOptimisticOperation({
      account: mockedAccount,
      transaction: mockedTransaction,
    });

    expect(op.type).toBe("OUT");
    expect(op.fee).toEqual(estimatedFee.tinybars);
    expect(op.extra).toEqual({
      memo: "Claiming staking rewards",
    });
  });
});
