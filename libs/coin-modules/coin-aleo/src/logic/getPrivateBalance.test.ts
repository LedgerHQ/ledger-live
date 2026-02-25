import BigNumber from "bignumber.js";
import { sdkClient } from "../network/sdk";
import { PROGRAM_ID } from "../constants";
import { testnetPrivateRecord } from "../__tests__/fixtures/api.fixture";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getPrivateBalance } from "./getPrivateBalance";

jest.mock("../network/sdk");

describe("getPrivateBalance", () => {
  const mockCurrency = getMockedCurrency();
  const mockViewKey = "AViewKey1mock";

  const mockDecryptedRecord = {
    owner: "aleo1owner",
    data: { microcredits: "500000u64.private" },
    nonce: "nonce1",
    version: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(sdkClient.decryptRecord).mockResolvedValue(mockDecryptedRecord);
  });

  it("should return zero balance and empty unspentRecords when no records are provided", async () => {
    const { balance, unspentRecords } = await getPrivateBalance({
      currency: mockCurrency,
      viewKey: mockViewKey,
      privateRecords: [],
    });

    expect(balance).toEqual(new BigNumber(0));
    expect(unspentRecords).toEqual([]);
    expect(sdkClient.decryptRecord).not.toHaveBeenCalled();
  });

  it("should decrypt an unspent credits record and return correct balance", async () => {
    const record = { ...testnetPrivateRecord, spent: false };

    const { balance, unspentRecords } = await getPrivateBalance({
      currency: mockCurrency,
      viewKey: mockViewKey,
      privateRecords: [record],
    });

    expect(sdkClient.decryptRecord).toHaveBeenCalledTimes(1);
    expect(sdkClient.decryptRecord).toHaveBeenCalledWith({
      currency: mockCurrency,
      viewKey: mockViewKey,
      ciphertext: record.record_ciphertext,
    });
    expect(balance).toEqual(new BigNumber(500000));
    expect(unspentRecords).toHaveLength(1);
    expect(unspentRecords[0]).toMatchObject({
      ...record,
      microcredits: "500000",
      decryptedData: mockDecryptedRecord,
    });
  });

  it("should accumulate balance from multiple unspent credits records", async () => {
    const record1 = { ...testnetPrivateRecord, commitment: "commitment1" };
    const record2 = { ...testnetPrivateRecord, commitment: "commitment2" };

    jest
      .mocked(sdkClient.decryptRecord)
      .mockResolvedValueOnce({
        ...mockDecryptedRecord,
        data: { microcredits: "300000u64.private" },
      })
      .mockResolvedValueOnce({
        ...mockDecryptedRecord,
        data: { microcredits: "200000u64.private" },
      });

    const { balance, unspentRecords } = await getPrivateBalance({
      currency: mockCurrency,
      viewKey: mockViewKey,
      privateRecords: [record1, record2],
    });

    expect(sdkClient.decryptRecord).toHaveBeenCalledTimes(2);
    expect(balance).toEqual(new BigNumber(500000));
    expect(unspentRecords).toHaveLength(2);
  });

  it("should skip records marked as spent", async () => {
    const spentRecord = { ...testnetPrivateRecord, spent: true };

    const { balance, unspentRecords } = await getPrivateBalance({
      currency: mockCurrency,
      viewKey: mockViewKey,
      privateRecords: [spentRecord],
    });

    expect(sdkClient.decryptRecord).not.toHaveBeenCalled();
    expect(balance).toEqual(new BigNumber(0));
    expect(unspentRecords).toEqual([]);
  });

  it("should skip records from non-credits programs", async () => {
    const nonCreditsRecord = { ...testnetPrivateRecord, program_name: "other_program.aleo" };

    const { balance, unspentRecords } = await getPrivateBalance({
      currency: mockCurrency,
      viewKey: mockViewKey,
      privateRecords: [nonCreditsRecord],
    });

    expect(sdkClient.decryptRecord).not.toHaveBeenCalled();
    expect(balance).toEqual(new BigNumber(0));
    expect(unspentRecords).toEqual([]);
  });

  it("should only process records with program_name equal to credits.aleo", async () => {
    const creditsRecord = {
      ...testnetPrivateRecord,
      program_name: PROGRAM_ID.CREDITS,
      spent: false,
    };
    const otherRecord = { ...testnetPrivateRecord, program_name: "staking.aleo", spent: false };

    const { balance, unspentRecords } = await getPrivateBalance({
      currency: mockCurrency,
      viewKey: mockViewKey,
      privateRecords: [creditsRecord, otherRecord],
    });

    expect(sdkClient.decryptRecord).toHaveBeenCalledTimes(1);
    expect(balance).toEqual(new BigNumber(500000));
    expect(unspentRecords).toHaveLength(1);
  });

  it("should skip spent records but process unspent ones in a mixed list", async () => {
    const spentRecord = { ...testnetPrivateRecord, commitment: "spent1", spent: true };
    const unspentRecord = { ...testnetPrivateRecord, commitment: "unspent1", spent: false };

    const { balance, unspentRecords } = await getPrivateBalance({
      currency: mockCurrency,
      viewKey: mockViewKey,
      privateRecords: [spentRecord, unspentRecord],
    });

    expect(sdkClient.decryptRecord).toHaveBeenCalledTimes(1);
    expect(balance).toEqual(new BigNumber(500000));
    expect(unspentRecords).toHaveLength(1);
  });

  it("should propagate errors thrown by sdkClient.decryptRecord", async () => {
    const decryptError = new Error("Decryption failed");
    jest.mocked(sdkClient.decryptRecord).mockRejectedValue(decryptError);

    await expect(
      getPrivateBalance({
        currency: mockCurrency,
        viewKey: mockViewKey,
        privateRecords: [testnetPrivateRecord],
      }),
    ).rejects.toThrow("Decryption failed");
  });
});
