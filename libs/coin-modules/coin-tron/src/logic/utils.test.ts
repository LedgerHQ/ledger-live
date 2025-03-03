import { OperationType } from "@ledgerhq/types-live";
import { TrongridTxInfo, TrongridTxType } from "../types";
import { getTronResources, txInfoToOperation } from "./utils";
import BigNumber from "bignumber.js";

jest.mock("@ledgerhq/coin-framework/operation", () => ({
  encodeOperationId: jest.fn(() => "encodedOpId"),
}));

let mockTx: TrongridTxInfo;

const TRX_MAGNITUDE = 1_000_000; // Magnitude 6

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

describe.only("getTronResources", () => {
  const parameters = [
    {
      name: "undefined",
      account: undefined,
      expected: {
        bandwidth: {
          freeLimit: new BigNumber(0),
          freeUsed: new BigNumber(0),
          gainedLimit: new BigNumber(0),
          gainedUsed: new BigNumber(0),
        },
        cacheTransactionInfoById: {},
        delegatedFrozen: { bandwidth: undefined, energy: undefined },
        energy: new BigNumber(0),
        frozen: { bandwidth: undefined, energy: undefined },
        lastVotedDate: undefined,
        lastWithdrawnRewardDate: undefined,
        legacyFrozen: { bandwidth: undefined, energy: undefined },
        tronPower: 0,
        unFrozen: { bandwidth: undefined, energy: undefined },
        unwithdrawnReward: new BigNumber(0),
        votes: [],
      },
    },
    {
      name: "empty",
      account: {},
      expected: {
        delegatedFrozen: { bandwidth: undefined, energy: undefined },
        frozen: { bandwidth: undefined, energy: undefined },
        lastWithdrawnRewardDate: undefined,
        legacyFrozen: { bandwidth: undefined, energy: undefined },
        tronPower: 0,
        unFrozen: { bandwidth: [], energy: [] },
        votes: [],
      },
    },
    {
      name: "delegated frozen bandwidth",
      account: {
        delegated_frozenV2_balance_for_bandwidth: 10 * TRX_MAGNITUDE,
      },
      expected: {
        delegatedFrozen: { bandwidth: { amount: new BigNumber(10_000_000) }, energy: undefined },
        frozen: { bandwidth: undefined, energy: undefined },
        lastWithdrawnRewardDate: undefined,
        legacyFrozen: { bandwidth: undefined, energy: undefined },
        tronPower: 10,
        unFrozen: { bandwidth: [], energy: [] },
        votes: [],
      },
    },
    {
      name: "delegated frozen energy",
      account: {
        account_resource: {
          delegated_frozenV2_balance_for_energy: 11 * TRX_MAGNITUDE,
        },
      },
      expected: {
        delegatedFrozen: { bandwidth: undefined, energy: { amount: new BigNumber(11_000_000) } },
        frozen: { bandwidth: undefined, energy: undefined },
        lastWithdrawnRewardDate: undefined,
        legacyFrozen: { bandwidth: undefined, energy: undefined },
        tronPower: 11,
        unFrozen: { bandwidth: [], energy: [] },
        votes: [],
      },
    },
    {
      name: "frozenV2 - ENERGY",
      account: {
        frozenV2: [
          {
            type: "ENERGY",
          },
        ],
      },
      expected: {
        delegatedFrozen: { bandwidth: undefined, energy: undefined },
        frozen: { bandwidth: undefined, energy: undefined },
        lastWithdrawnRewardDate: undefined,
        legacyFrozen: { bandwidth: undefined, energy: undefined },
        tronPower: 0,
        unFrozen: { bandwidth: [], energy: [] },
        votes: [],
      },
    },
    {
      name: "frozenV2 - ENERGY with amount",
      account: {
        frozenV2: [
          {
            type: "ENERGY",
            amount: 12 * TRX_MAGNITUDE,
          },
        ],
      },
      expected: {
        delegatedFrozen: { bandwidth: undefined, energy: undefined },
        frozen: { bandwidth: undefined, energy: { amount: new BigNumber(12_000_000) } },
        lastWithdrawnRewardDate: undefined,
        legacyFrozen: { bandwidth: undefined, energy: undefined },
        tronPower: 12,
        unFrozen: { bandwidth: [], energy: [] },
        votes: [],
      },
    },
    {
      name: "frozenV2 - TRON_POWER with amount",
      account: {
        frozenV2: [
          {
            type: "TRON_POWER",
            amount: 13 * TRX_MAGNITUDE,
          },
        ],
      },
      expected: {
        delegatedFrozen: { bandwidth: undefined, energy: undefined },
        frozen: { bandwidth: undefined, energy: undefined },
        lastWithdrawnRewardDate: undefined,
        legacyFrozen: { bandwidth: undefined, energy: undefined },
        tronPower: 0,
        unFrozen: { bandwidth: [], energy: [] },
        votes: [],
      },
    },
    {
      name: "frozenV2 - undefined type with amount",
      account: {
        frozenV2: [
          {
            amount: 14 * TRX_MAGNITUDE,
          },
        ],
      },
      expected: {
        delegatedFrozen: { bandwidth: undefined, energy: undefined },
        frozen: { bandwidth: { amount: new BigNumber(14_000_000) }, energy: undefined },
        lastWithdrawnRewardDate: undefined,
        legacyFrozen: { bandwidth: undefined, energy: undefined },
        tronPower: 14,
        unFrozen: { bandwidth: [], energy: [] },
        votes: [],
      },
    },
    {
      name: "frozen Legacy - Bandwidth empty",
      account: {
        frozen: [],
      },
      expected: {
        delegatedFrozen: { bandwidth: undefined, energy: undefined },
        frozen: { bandwidth: undefined, energy: undefined },
        lastWithdrawnRewardDate: undefined,
        legacyFrozen: { bandwidth: undefined, energy: undefined },
        tronPower: 0,
        unFrozen: { bandwidth: [], energy: [] },
        votes: [],
      },
    },
    {
      name: "frozen Legacy - Bandwidth with amount",
      account: {
        frozen: [
          {
            frozen_balance: 15 * TRX_MAGNITUDE,
            expire_time: 10,
          },
        ],
      },
      expected: {
        delegatedFrozen: { bandwidth: undefined, energy: undefined },
        frozen: { bandwidth: undefined, energy: undefined },
        lastWithdrawnRewardDate: undefined,
        legacyFrozen: {
          bandwidth: {
            amount: new BigNumber(15_000_000),
            expiredAt: new Date("1970-01-01T00:00:00.010Z"),
          },
          energy: undefined,
        },
        tronPower: 15,
        unFrozen: { bandwidth: [], energy: [] },
        votes: [],
      },
    },
    {
      name: "frozen Legacy - Energy",
      account: {
        account_resource: {
          frozen_balance_for_energy: {
            frozen_balance: 16 * TRX_MAGNITUDE,
            expire_time: 10,
          },
        },
      },
      expected: {
        delegatedFrozen: { bandwidth: undefined, energy: undefined },
        frozen: { bandwidth: undefined, energy: undefined },
        lastWithdrawnRewardDate: undefined,
        legacyFrozen: {
          bandwidth: undefined,
          energy: {
            amount: new BigNumber(16_000_000),
            expiredAt: new Date("1970-01-01T00:00:00.010Z"),
          },
        },
        tronPower: 16,
        unFrozen: { bandwidth: [], energy: [] },
        votes: [],
      },
    },
    {
      name: "UnfrozenV2",
      account: {
        unfrozenV2: [
          {
            type: "ENERGY",
            unfreeze_amount: 10 * TRX_MAGNITUDE,
            unfreeze_expire_time: 10,
          },
          {
            unfreeze_amount: 11 * TRX_MAGNITUDE,
            unfreeze_expire_time: 20,
          },
        ],
      },
      expected: {
        delegatedFrozen: { bandwidth: undefined, energy: undefined },
        frozen: { bandwidth: undefined, energy: undefined },
        lastWithdrawnRewardDate: undefined,
        legacyFrozen: { bandwidth: undefined, energy: undefined },
        tronPower: 0,
        unFrozen: {
          bandwidth: [
            {
              amount: new BigNumber(11_000_000),
              expireTime: new Date("1970-01-01T00:00:00.020Z"),
            },
          ],
          energy: [
            {
              amount: new BigNumber(10_000_000),
              expireTime: new Date("1970-01-01T00:00:00.010Z"),
            },
          ],
        },
        votes: [],
      },
    },
    {
      name: "Votes",
      account: {
        votes: [
          {
            vote_address: "VOTE ADDRESS",
            vote_count: 23,
          },
        ],
      },
      expected: {
        delegatedFrozen: { bandwidth: undefined, energy: undefined },
        frozen: { bandwidth: undefined, energy: undefined },
        lastWithdrawnRewardDate: undefined,
        legacyFrozen: { bandwidth: undefined, energy: undefined },
        tronPower: 0,
        unFrozen: { bandwidth: [], energy: [] },
        votes: [
          {
            address: "VOTE ADDRESS",
            voteCount: 23,
          },
        ],
      },
    },
    {
      name: "lastWithdrawnRewardDate",
      account: {
        latest_withdraw_time: 42,
      },
      expected: {
        delegatedFrozen: { bandwidth: undefined, energy: undefined },
        frozen: { bandwidth: undefined, energy: undefined },
        lastWithdrawnRewardDate: new Date("1970-01-01T00:00:00.042Z"),
        legacyFrozen: { bandwidth: undefined, energy: undefined },
        tronPower: 0,
        unFrozen: { bandwidth: [], energy: [] },
        votes: [],
      },
    },
  ];

  it.each(parameters)("returns expected TronResources for $name", ({ account, expected }) => {
    const result = getTronResources(account);

    expect(result).toEqual(expected);
  });
});
