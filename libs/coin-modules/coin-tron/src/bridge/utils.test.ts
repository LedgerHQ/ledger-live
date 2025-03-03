import { OperationType } from "@ledgerhq/types-live";
import { TrongridTxInfo, TrongridTxType } from "../types";
import { txInfoToOperation } from "./utils";

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
