import { fetchTronAccount, fetchTronAccountTxs } from ".";
import { setCoinConfig } from "../config";

describe("Network calls", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "https://tron.coin.ledger.com",
      },
    }));
  });

  describe("fetchTronAccount", () => {
    it.each([
      {
        address: "TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre",
        expectedAccount: {
          account_resource: {
            energy_window_optimized: true,
            energy_window_size: 28800000,
            frozen_balance_for_energy: {
              expire_time: 1670681610000,
              frozen_balance: 1000000,
            },
            latest_consume_time_for_energy: 1722862287000,
          },
          active_permission: [
            {
              id: 2,
              keys: [{ address: "TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre", weight: 1 }],
              operations: "7fff1fc0033e0300000000000000000000000000000000000000000000000000",
              permission_name: "active",
              threshold: 1,
              type: "Active",
            },
          ],
          address: "416e3b44b96104b26f84057974a1f0c9880f7c9b13",
          assetV2: [
            {
              key: "1002000",
              value: 899000,
            },
            {
              key: "1004031",
              value: 7137907,
            },
          ],
          balance: 532211751,
          create_time: 1604500590000,
          free_asset_net_usageV2: [
            {
              key: "1004031",
              value: 0,
            },
            {
              key: "1002000",
              value: 0,
            },
          ],
          frozen: [
            {
              expire_time: 1667058846000,
              frozen_balance: 5000000,
            },
          ],
          frozenV2: [
            {},
            { amount: 402000000, type: "ENERGY" },
            { type: "UNKNOWN_ENUM_VALUE_ResourceCode_2" },
            // { type: "TRON_POWER" },
          ],
          latest_consume_free_time: 1728404070000,
          latest_opration_time: 1728424167000,
          latest_withdraw_time: 1728404070000,
          net_window_optimized: true,
          net_window_size: 28800000,
          owner_permission: {
            keys: [{ address: "TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre", weight: 1 }],
            permission_name: "owner",
            threshold: 1,
          },
          trc20: [
            {
              TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7: "1000000",
            },
            {
              TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9: "1234000000000000000",
            },
            {
              TXL6rJbvmjD46zeN1JssfgxvSo99qC8MRT: "13409316000000000000",
            },
            {
              TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t: "178000",
            },
          ],
          votes: [
            {
              vote_address: "TGyrSc9ZmTdbYziuk1SKEmdtCdETafewJ9",
              vote_count: 408,
            },
          ],
        },
      },
      // {
      //   address: "TY2ksFgpvb82TgGPwUSa7iseqPW5weYQyh",
      //   expectedAccount: {
      //     account_resource: { energy_window_optimized: true, energy_window_size: 28800000 },
      //     active_permission: [
      //       {
      //         id: 2,
      //         keys: [{ address: "TY2ksFgpvb82TgGPwUSa7iseqPW5weYQyh", weight: 1 }],
      //         operations: "7fff1fc0033ec30f000000000000000000000000000000000000000000000000",
      //         permission_name: "active",
      //         threshold: 1,
      //         type: "Active",
      //       },
      //     ],
      //     address: "41f1fe9d73ffb3b6ab532858b266c02f63410fbd70",
      //     balance: 10000004,
      //     create_time: 1708014963000,
      //     frozenV2: [
      //       { amount: 5000000 },
      //       { type: "ENERGY" },
      //       { type: "UNKNOWN_ENUM_VALUE_ResourceCode_2" },
      //       // { type: "TRON_POWER" },
      //     ],
      //     latest_consume_free_time: 1708016832000,
      //     latest_opration_time: 1708016832000,
      //     net_window_optimized: true,
      //     net_window_size: 28800000,
      //     owner_permission: {
      //       keys: [{ address: "TY2ksFgpvb82TgGPwUSa7iseqPW5weYQyh", weight: 1 }],
      //       permission_name: "owner",
      //       threshold: 1,
      //     },
      //     trc20: [],
      //   },
      // },
    ])(
      "maps all fields correctly",
      async ({ address, expectedAccount }) => {
        // WHEN
        const results = await fetchTronAccount(address);

        // THEN
        expect(results).toEqual([expectedAccount]);
      },
      10 * 1000,
    );
  });

  describe("fetchTronAccountTxs", () => {
    it.only(
      "maps all fields correctly",
      async () => {
        // WHEN
        // const addr = "TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre";
        // const addr = "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj";
        // const addr = "THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi";
        // const addr = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
        // const addr = "TUxd6v64YTWkfpFpNDdtgc5Ps4SfGxwizT";
        const addr = "TY2ksFgpvb82TgGPwUSa7iseqPW5weYQyh";
        const results = await fetchTronAccountTxs(addr, txs => txs.length < 100, {});

        // THEN
        expect(results).not.toHaveLength(0);
      },
      10 * 1000,
    );
  });
});
