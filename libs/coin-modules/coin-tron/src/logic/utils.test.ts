import { Account, OperationType } from "@ledgerhq/types-live";
import { Transaction, TrongridTxInfo, TrongridTxType, Vote } from "../types";
import { getEstimatedBlockSize, txInfoToOperation } from "./utils";
import BigNumber from "bignumber.js";

jest.mock("@ledgerhq/coin-framework/operation", () => ({
  encodeOperationId: jest.fn(() => "encodedOpId"),
}));

let mockTx: TrongridTxInfo;

const testingMap: Record<TrongridTxType, OperationType> = {
  TransferContract: "IN",
  TransferAssetContract: "IN",
  TriggerSmartContract: "IN",
  ContractApproval: "APPROVE",
  ExchangeTransactionContract: "OUT",
  VoteWitnessContract: "VOTE",
  WithdrawBalanceContract: "REWARD",
  FreezeBalanceContract: "FREEZE",
  FreezeBalanceV2Contract: "FREEZE",
  UnfreezeBalanceV2Contract: "UNFREEZE",
  WithdrawExpireUnfreezeContract: "WITHDRAW_EXPIRE_UNFREEZE",
  UnDelegateResourceContract: "UNDELEGATE_RESOURCE",
  UnfreezeBalanceContract: "LEGACY_UNFREEZE",
};

describe("txInfoToOperation", () => {
  beforeEach(() => {
    mockTx = {} as TrongridTxInfo;
  });

  it.each(Object.keys(testingMap))(
    `should return correct operation type for %p trongrid tx type`,
    trongridTxType => {
      const tx: TrongridTxInfo = {
        ...mockTx,
        type: trongridTxType as TrongridTxType,
      };

      expect(txInfoToOperation("accountId", "address", tx)?.type).toEqual(
        testingMap[trongridTxType as keyof Record<TrongridTxType, OperationType>],
      );
    },
  );

  it.each(["TransferContract", "TransferAssetContract", "TriggerSmartContract"])(
    "should return OUT operation type when from is equal to user address for %p trongrid tx type",
    trongridTxType => {
      const tx: TrongridTxInfo = {
        ...mockTx,
        type: trongridTxType as TrongridTxType,
        from: "address",
      };

      expect(txInfoToOperation("accountId", "address", tx)?.type).toEqual("OUT");
    },
  );

  it("should return undefined operation type for unknown tx type", () => {
    const tx: TrongridTxInfo = {
      ...mockTx,
      type: "Unknown" as TrongridTxType,
    };

    expect(txInfoToOperation("accountId", "address", tx)).toBeUndefined();
  });

  it("should return correct encoded operation id", () => {
    const tx: TrongridTxInfo = {
      ...mockTx,
      type: "TransferContract",
      txID: "txId",
    };

    expect(txInfoToOperation("accountId", "address", tx)?.id).toEqual("encodedOpId");
  });
});

describe("getEstimatedBlockSize", () => {
  it.each([
    {
      account: {} as Account,
      transaction: {
        mode: "send",
        votes: Array<Vote>(),
      } as Transaction,
      expectedValue: BigNumber(270),
    },
    {
      account: {
        subAccounts: [
          {
            id: "12ab34c56",
            type: "TokenAccount",
            token: {
              tokenType: "trc10",
            },
          },
        ],
      } as Account,
      transaction: {
        mode: "send",
        subAccountId: "12ab34c56",
        votes: Array<Vote>(),
      } as Transaction,
      expectedValue: BigNumber(285),
    },
    {
      account: {
        subAccounts: [
          {
            id: "12ab34c56",
            type: "TokenAccount",
            token: {
              tokenType: "trc20",
            },
          },
        ],
      } as Account,
      transaction: {
        mode: "send",
        subAccountId: "12ab34c56",
        votes: Array<Vote>(),
      } as Transaction,
      expectedValue: BigNumber(350),
    },
    {
      account: {} as Account,
      transaction: {
        mode: "freeze",
        votes: Array<Vote>(),
      } as Transaction,
      expectedValue: BigNumber(260),
    },
    {
      account: {} as Account,
      transaction: {
        mode: "unfreeze",
        votes: Array<Vote>(),
      } as Transaction,
      expectedValue: BigNumber(260),
    },
    {
      account: {} as Account,
      transaction: {
        mode: "claimReward",
        votes: Array<Vote>(),
      } as Transaction,
      expectedValue: BigNumber(260),
    },
    {
      account: {} as Account,
      transaction: {
        mode: "withdrawExpireUnfreeze",
        votes: Array<Vote>(),
      } as Transaction,
      expectedValue: BigNumber(260),
    },
    {
      account: {} as Account,
      transaction: {
        mode: "unDelegateResource",
        votes: Array<Vote>(),
      } as Transaction,
      expectedValue: BigNumber(260),
    },
    {
      account: {} as Account,
      transaction: {
        mode: "legacyUnfreeze",
        votes: Array<Vote>(),
      } as Transaction,
      expectedValue: BigNumber(260),
    },
    {
      account: {} as Account,
      transaction: {
        mode: "vote",
        votes: [{}, {}, {}] as Vote[],
      } as Transaction,
      expectedValue: BigNumber(290 + 3 * 19),
    },
  ])("returns expected hardcoded value 😔", ({ account, transaction, expectedValue }) => {
    // When
    const value = getEstimatedBlockSize(account, transaction);

    // Then
    expect(value).toEqual(expectedValue);
  });
});
