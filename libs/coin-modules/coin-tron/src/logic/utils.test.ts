import BigNumber from "bignumber.js";
import coinConfig from "../config";
import { decodeTransaction, getTronResources } from "./utils";

describe("decodeTransaction", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "http://localhost",
      },
    }));
  });

  it("creates a TRX transaction in TronWeb format", async () => {
    const result = await decodeTransaction(
      "0a020ee522082e5fc67747a428af40f0e2ace4d3325a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541fd49eda0f23ff7ec1d03b52c3a45991c24cd440e12154198927ffb9f554dc4a453c64b2e553a02d6df514b18e80770fd9ca9e4d332",
    );

    expect(result).toEqual({
      // visible: true,
      txID: "477eaebbf508f7e2030f52917d34d264cfef5764d7f73eda582708e5762ceb25",
      raw_data: {
        contract: [
          {
            parameter: {
              value: {
                amount: 1000,
                owner_address: "41fd49eda0f23ff7ec1d03b52c3a45991c24cd440e",
                to_address: "4198927ffb9f554dc4a453c64b2e553a02d6df514b",
              },
              type_url: "type.googleapis.com/protocol.TransferContract",
            },
            type: "TransferContract",
          },
        ],
        ref_block_bytes: "0ee5",
        ref_block_hash: "2e5fc67747a428af",
        expiration: 1740477510000,
        timestamp: 1740477451901,
      },
      raw_data_hex:
        "0a020ee522082e5fc67747a428af40f0e2ace4d3325a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541fd49eda0f23ff7ec1d03b52c3a45991c24cd440e12154198927ffb9f554dc4a453c64b2e553a02d6df514b18e80770fd9ca9e4d332",
    });
  });

  it("creates a TRC10 transaction in TronWeb format", async () => {
    const result = await decodeTransaction(
      "0a0204472208f9107c334bf13f4a4080c68fbfd4325a730802126f0a32747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e736665724173736574436f6e747261637412390a0731303031333034121541b183301d6301fae224c6ab9b28b19b6d1625bf231a154198927ffb9f554dc4a453c64b2e553a02d6df514b206470a3fb8bbfd432",
    );

    expect(result).toEqual({
      // visible: true,
      txID: "db5ca128181ff7d8ab7b77d95c6a89e28325cae9066791182c6b8cb42200cfc9",
      raw_data: {
        contract: [
          {
            parameter: {
              value: {
                amount: 100,
                asset_name: "1001304",
                owner_address: "41b183301d6301fae224c6ab9b28b19b6d1625bf23",
                to_address: "4198927ffb9f554dc4a453c64b2e553a02d6df514b",
              },
              type_url: "type.googleapis.com/protocol.TransferAssetContract",
            },
            type: "TransferAssetContract",
          },
        ],
        ref_block_bytes: "0447",
        ref_block_hash: "f9107c334bf13f4a",
        expiration: 1740667872000,
        timestamp: 1740667813283,
      },
      raw_data_hex:
        "0a0204472208f9107c334bf13f4a4080c68fbfd4325a730802126f0a32747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e736665724173736574436f6e747261637412390a0731303031333034121541b183301d6301fae224c6ab9b28b19b6d1625bf231a154198927ffb9f554dc4a453c64b2e553a02d6df514b206470a3fb8bbfd432",
    });
  });

  it("creates a TRC20 transaction in TronWeb format", async () => {
    const result = await decodeTransaction(
      "0a02054a22089334553fd5c2cb624098abbfbfd4325aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541fd49eda0f23ff7ec1d03b52c3a45991c24cd440e12154142a1e39aefa49290f2b3f9ed688d7cecf86cd6e02244a9059cbb00000000000000000000004115208ef33a926919ed270e2fa61367b2da3753da0000000000000000000000000000000000000000000000000000000000000032708de6bbbfd43290018094ebdc03",
    );

    expect(result).toEqual({
      // visible: true,
      txID: "a28a5946f7c805abf1ebaebd9832bdcbd8578c51a948e8cc1dff6a1c20f578ef",
      raw_data: {
        contract: [
          {
            parameter: {
              value: {
                data: "a9059cbb00000000000000000000004115208ef33a926919ed270e2fa61367b2da3753da0000000000000000000000000000000000000000000000000000000000000032",
                owner_address: "41fd49eda0f23ff7ec1d03b52c3a45991c24cd440e",
                contract_address: "4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0",
              },
              type_url: "type.googleapis.com/protocol.TriggerSmartContract",
            },
            type: "TriggerSmartContract",
          },
        ],
        ref_block_bytes: "054a",
        ref_block_hash: "9334553fd5c2cb62",
        expiration: 1740668655000,
        fee_limit: 1000000000,
        timestamp: 1740668597005,
      },
      raw_data_hex:
        "0a02054a22089334553fd5c2cb624098abbfbfd4325aae01081f12a9010a31747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e54726967676572536d617274436f6e747261637412740a1541fd49eda0f23ff7ec1d03b52c3a45991c24cd440e12154142a1e39aefa49290f2b3f9ed688d7cecf86cd6e02244a9059cbb00000000000000000000004115208ef33a926919ed270e2fa61367b2da3753da0000000000000000000000000000000000000000000000000000000000000032708de6bbbfd43290018094ebdc03",
    });
  });
});

const TRX_MAGNITUDE = 1_000_000; // Magnitude 6

describe.only("getTronResources", () => {
  const parameters = [
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
