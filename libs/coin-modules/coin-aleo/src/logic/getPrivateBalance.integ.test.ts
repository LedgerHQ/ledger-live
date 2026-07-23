import BigNumber from "bignumber.js";
import aleoConfig from "../config";
import { getTestnetIntegConfig } from "../__tests__/fixtures/config.fixture";
import {
  testnetViewKey,
  testnetPrivateRecord,
  testnetOutgoingPrivateToPublicRecord,
} from "../__tests__/fixtures/api.fixture";
import { setupCalStore } from "../__tests__/helpers/cal";
import { getPrivateBalance } from "./getPrivateBalance";

describe("getPrivateBalance", () => {
  const config = getTestnetIntegConfig();

  beforeAll(() => {
    setupCalStore();
    aleoConfig.setCoinConfig(() => config);
  });

  it("should sum microcredits across all unspent credits records", async () => {
    const { balance, unspentRecords } = await getPrivateBalance({
      config,
      viewKey: testnetViewKey,
      privateRecords: [testnetPrivateRecord, testnetOutgoingPrivateToPublicRecord],
      oldUnspentRecords: [],
    });

    expect(unspentRecords.map(r => r.microcredits)).toEqual(["69999", "0"]);
    expect(balance).toEqual(new BigNumber(69999));
  });

  it("should return all decrypted records as unspentRecords", async () => {
    const { unspentRecords } = await getPrivateBalance({
      config,
      viewKey: testnetViewKey,
      privateRecords: [testnetPrivateRecord],
      oldUnspentRecords: [],
    });

    expect(unspentRecords).toEqual([
      expect.objectContaining({
        microcredits: "69999",
        decryptedData: expect.objectContaining({
          data: {
            microcredits: "69999u64.private",
          },
        }),
      }),
    ]);
  });

  it("should return zero balance and empty records when given no records", async () => {
    const { balance, unspentRecords } = await getPrivateBalance({
      config,
      viewKey: testnetViewKey,
      privateRecords: [],
      oldUnspentRecords: [],
    });

    expect(balance).toEqual(new BigNumber(0));
    expect(unspentRecords).toEqual([]);
  });

  it("should skip records marked as spent", async () => {
    const { balance, unspentRecords } = await getPrivateBalance({
      config,
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
      config,
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
