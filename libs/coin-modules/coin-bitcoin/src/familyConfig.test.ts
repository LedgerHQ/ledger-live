import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { firstValueFrom, Observable } from "rxjs";
import BigNumber from "bignumber.js";
import { findFamilyConfigById } from "./familyConfig";
import { createFixtureAccount } from "./fixtures/common.fixtures";
import { JsonRpcClient } from "@ledgerhq/zcash-shielded/jsonRpcClient";

jest.spyOn(JsonRpcClient.prototype, "getBlockCount").mockImplementation(async () => {
  return 420;
});

jest.spyOn(JsonRpcClient.prototype, "getBlock").mockImplementation(async (blockHeight: string) => ({
  height: parseInt(blockHeight),
  tx: [],
  hash: "",
  time: 1,
}));

jest
  .spyOn(JsonRpcClient.prototype, "getRawTransaction")
  .mockImplementation(async (txid: string) => ({
    hex: "123abc",
    orchard: {
      actions: [],
      valueBalance: 0,
      valueBalanceZat: 0,
    },
    time: 1,
    txid,
    height: 1,
    blockhash: "",
  }));

describe("findFamilyConfigById", () => {
  describe("when familyConfigId is bitcoin", () => {
    test("selects Bitcoin family config settings without optional sync method", () => {
      const familyConfig = findFamilyConfigById("bitcoin");

      expect(familyConfig).toBe(undefined);
    });
  });

  describe("when familyConfigId is zcash", () => {
    test("selects ZCash family config settings with optional sync method", () => {
      const currency = getCryptoCurrencyById("zcash");
      const familyConfig = findFamilyConfigById("zcash");

      expect(familyConfig).toMatchObject({
        sync: expect.any(Function),
      });

      if (familyConfig?.sync) {
        const obs = familyConfig.sync(
          {
            currency,
            address: "",
            index: 0,
            derivationPath: "",
            derivationMode: "",
            initialAccount: {
              ...createFixtureAccount(),
              privateInfo: {
                ufvk: "uview123...",
                saplingBalance: new BigNumber(0),
                orchardBalance: new BigNumber(0),
                syncState: "complete",
                birthday: null,
                lastSyncTimestamp: null,
                lastBlockProcessed: null,
                transactions: [],
                progress: 0,
                estimatedTimeRemaining: { hours: 0, minutes: 0 },
              },
            },
          },
          {
            paginationConfig: {
              operationsPerAccountId: {},
              operations: 0,
            },
          },
        );

        expect(obs).toBeInstanceOf(Observable);
      }

      expect.assertions(2);
    });

    test("throws an error if ufvk is missing in privateInfo", async () => {
      const currency = getCryptoCurrencyById("zcash");
      const familyConfig = findFamilyConfigById("zcash");

      if (familyConfig?.sync) {
        const obs = familyConfig.sync(
          {
            currency,
            address: "",
            index: 0,
            derivationPath: "",
            derivationMode: "",
          },
          {
            paginationConfig: {
              operationsPerAccountId: {},
              operations: 0,
            },
          },
        );

        await expect(firstValueFrom(obs)).rejects.toThrow(
          "Missing unified full viewing key (ufvk) for ZCash shielded sync",
        );
      }

      expect.assertions(1);
    });

    test("starts at block 0 if blockHeight if account was never synced before", async () => {
      const currency = getCryptoCurrencyById("zcash");
      const familyConfig = findFamilyConfigById("zcash");

      if (familyConfig?.sync) {
        const obs = familyConfig.sync(
          {
            currency,
            address: "",
            index: 0,
            derivationPath: "",
            derivationMode: "",
            initialAccount: {
              ...createFixtureAccount(),
              blockHeight: 0,
              privateInfo: {
                ufvk: "uviewtest1...",
                saplingBalance: new BigNumber(0),
                orchardBalance: new BigNumber(0),
                syncState: "outdated",
                birthday: null,
                lastSyncTimestamp: null,
                lastBlockProcessed: null,
                transactions: [],
                progress: 0,
                estimatedTimeRemaining: { hours: 0, minutes: 0 },
              },
            },
          },
          {
            paginationConfig: {
              operationsPerAccountId: {},
              operations: 0,
            },
          },
        );

        await expect(firstValueFrom(obs)).resolves.toMatchObject({
          lastBlockProcessed: 99,
          processedBlocks: 100,
          remainingBlocks: 321,
          transactions: [],
        });
      }

      expect.assertions(1);
    });

    test("starts at given block if starting block other than 0 is provided in initialAccount", async () => {
      const currency = getCryptoCurrencyById("zcash");
      const familyConfig = findFamilyConfigById("zcash");

      if (familyConfig?.sync) {
        const obs = familyConfig.sync(
          {
            currency,
            address: "",
            index: 0,
            derivationPath: "",
            derivationMode: "",
            initialAccount: {
              ...createFixtureAccount(),
              blockHeight: 42,
              privateInfo: {
                ufvk: "uviewtest1...",
                saplingBalance: new BigNumber(0),
                orchardBalance: new BigNumber(0),
                syncState: "outdated",
                birthday: null,
                lastSyncTimestamp: null,
                lastBlockProcessed: null,
                transactions: [],
                progress: 0,
                estimatedTimeRemaining: { hours: 0, minutes: 0 },
              },
            },
          },
          {
            paginationConfig: {
              operationsPerAccountId: {},
              operations: 0,
            },
          },
        );

        await expect(firstValueFrom(obs)).resolves.toMatchObject({
          lastBlockProcessed: 142,
          processedBlocks: 100,
          remainingBlocks: 278,
          transactions: [],
        });
      }

      expect.assertions(1);
    });
  });
});
