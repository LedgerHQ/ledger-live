import BigNumber from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import aleoConfig from "../config";
import { testnetViewKey, testnetPrivateRecord } from "../__tests__/fixtures/api.fixture";
import { getPrivateBalance } from "./getPrivateBalance";

setupCalClientStore();

describe("getPrivateBalance", () => {
  const currency = getCryptoCurrencyById("aleo");

  beforeAll(() => {
    aleoConfig.setCoinConfig(() => ({
      status: { type: "active" },
      networkType: "testnet",
      apiUrls: {
        node: getEnv("ALEO_TESTNET_NODE_ENDPOINT"),
        sdk: getEnv("ALEO_TESTNET_SDK_ENDPOINT"),
      },
    }));
  });

  it("should sum microcredits across all unspent credits records", async () => {
    const { balance } = await getPrivateBalance({
      currency,
      viewKey: testnetViewKey,
      privateRecords: [testnetPrivateRecord, testnetPrivateRecord],
    });

    expect(balance).toEqual(new BigNumber(800000 + 800000));
  });

  it("should return all decrypted records as unspentRecords", async () => {
    const { unspentRecords } = await getPrivateBalance({
      currency,
      viewKey: testnetViewKey,
      privateRecords: [testnetPrivateRecord],
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
    });

    expect(balance).toEqual(new BigNumber(0));
    expect(unspentRecords).toEqual([]);
  });

  it("should skip records marked as spent", async () => {
    const { balance, unspentRecords } = await getPrivateBalance({
      currency,
      viewKey: testnetViewKey,
      privateRecords: [{ ...testnetPrivateRecord, spent: true }],
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
    });

    expect(unspentRecords).toHaveLength(1);
  });
});
