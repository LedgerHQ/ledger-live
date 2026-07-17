import BigNumber from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import { buildStandaloneCryptoAssetsStore } from "@features/platform-currencies/legacy";
import {
  setCryptoAssetsStore,
  type FrameworkCryptoAssetsStore,
} from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import aleoConfig from "../config";
import { mockFeeByTransactionType } from "../__tests__/fixtures/config.fixture";
import { testnetViewKey, testnetPrivateRecord } from "../__tests__/fixtures/api.fixture";
import { getPrivateBalance } from "./getPrivateBalance";

setCryptoAssetsStore(
  buildStandaloneCryptoAssetsStore({
    calServiceUrl: process.env.CAL_SERVICE_URL ?? "https://global.api.prd.ledger.com/cal",
    ledgerClientVersion: process.env.LEDGER_CLIENT_VERSION || "coin-aleo-integration-test",
  }) as unknown as FrameworkCryptoAssetsStore,
);

describe("getPrivateBalance", () => {
  const currency = getCryptoCurrencyById("aleo");

  beforeAll(() => {
    aleoConfig.setCoinConfig(() => ({
      status: { type: "active" },
      networkType: "testnet",
      apiUrls: {
        node: getEnv<string>("ALEO_NODE_ENDPOINT"),
        sdk: getEnv<string>("ALEO_TESTNET_SDK_ENDPOINT"),
      },
      feeByTransactionType: mockFeeByTransactionType,
      feeSafetyMultiplier: 1,
      isFeeSponsored: true,
      enableTokens: false,
      useEncryptedProve: false,
      recordPickingStrategy: "manual",
    }));
  });

  it("should sum microcredits across all unspent credits records", async () => {
    const { balance } = await getPrivateBalance({
      currency,
      viewKey: testnetViewKey,
      privateRecords: [testnetPrivateRecord, testnetPrivateRecord],
      oldUnspentRecords: [],
    });

    expect(balance).toEqual(new BigNumber(800000 + 800000));
  });

  it("should return all decrypted records as unspentRecords", async () => {
    const { unspentRecords } = await getPrivateBalance({
      currency,
      viewKey: testnetViewKey,
      privateRecords: [testnetPrivateRecord],
      oldUnspentRecords: [],
    });

    expect(unspentRecords).toEqual([
      expect.objectContaining({
        microcredits: "800000",
        decryptedData: expect.objectContaining({
          data: {
            microcredits: "800000u64.private",
          },
        }),
      }),
    ]);
  });

  it("should return zero balance and empty records when given no records", async () => {
    const { balance, unspentRecords } = await getPrivateBalance({
      currency,
      viewKey: testnetViewKey,
      privateRecords: [],
      oldUnspentRecords: [],
    });

    expect(balance).toEqual(new BigNumber(0));
    expect(unspentRecords).toEqual([]);
  });

  it("should skip records marked as spent", async () => {
    const { balance, unspentRecords } = await getPrivateBalance({
      currency,
      viewKey: testnetViewKey,
      privateRecords: [{ ...testnetPrivateRecord, spent: true }],
      oldUnspentRecords: [],
    });

    expect(balance).toEqual(new BigNumber(0));
    expect(unspentRecords).toEqual([]);
  });

  it("should skip records from non-credits programs", async () => {
    const mixedRecords = [
      testnetPrivateRecord,
      { ...testnetPrivateRecord, program_name: "other.aleo" },
    ];

    const { unspentRecords } = await getPrivateBalance({
      currency,
      viewKey: testnetViewKey,
      privateRecords: mixedRecords,
      oldUnspentRecords: [],
    });

    expect(unspentRecords).toEqual([
      expect.objectContaining({
        program_name: "credits.aleo",
      }),
    ]);
  });
});
