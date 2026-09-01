import BigNumber from "bignumber.js";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import { TRANSACTION_TYPE } from "./constants";
import aleoCoinConfig from "./config";
import { getMockedAccount } from "./__tests__/fixtures/account.fixture";
import { getMockedConfig } from "./__tests__/fixtures/config.fixture";
import { getMockedTransaction } from "./__tests__/fixtures/transaction.fixture";
import type { TransactionStatus } from "./types";

jest.mock("./config");

describe("getDeviceTransactionConfig", () => {
  const mockAleoConfig = jest.mocked(aleoCoinConfig);
  const mockTransaction = getMockedTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC });
  const mockAccount = getMockedAccount();
  const mockStatus: TransactionStatus = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(1000),
    totalSpent: new BigNumber(1000),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...getMockedConfig("testnet"),
      isFeeSponsored: false,
    });
  });

  it.each([
    ["Transfer Public", TRANSACTION_TYPE.TRANSFER_PUBLIC],
    ["Transfer Private", TRANSACTION_TYPE.TRANSFER_PRIVATE],
    ["Shield", TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE],
    ["Unshield", TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC],
    ["Transfer Token Public", TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC],
    ["Transfer Token Private", TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE],
    ["Token Shield", TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE],
    ["Token Unshield", TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC],
  ] as const)("should return method '%s' for mode '%s'", async (expectedMethod, mode) => {
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: getMockedTransaction({ mode }),
      status: mockStatus,
    });

    expect(fields).toContainEqual({ type: "text", label: "Method", value: expectedMethod });
  });

  it("should return method 'Unknown' for an invalid mode", async () => {
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      // @ts-expect-error - testing invalid mode
      transaction: { ...mockTransaction, mode: "invalidMode" },
      status: mockStatus,
    });

    expect(fields).toContainEqual({ type: "text", label: "Method", value: "Unknown" });
  });

  it("should include the From field with the account's address", async () => {
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: mockTransaction,
      status: mockStatus,
    });

    expect(fields).toContainEqual({
      type: "address",
      label: "From",
      address: mockAccount.freshAddress,
    });
  });

  it("should include the To field with the transaction recipient", async () => {
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: mockTransaction,
      status: mockStatus,
    });

    expect(fields).toContainEqual({
      type: "address",
      label: "To",
      address: mockTransaction.recipient,
    });
  });

  it("should include the Amount field", async () => {
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: mockTransaction,
      status: mockStatus,
    });

    expect(fields).toContainEqual({ type: "amount", label: "Amount" });
  });

  // The on-chain call takes only the staker, so the amount is absent from the signed
  // payload and the device shows no amount. `transaction.amount` is pinned to 0 for this
  // mode, so keeping the field would advertise a bogus "0 ALEO".
  it("should omit the Amount field for claim unbond, which carries no amount", async () => {
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: getMockedTransaction({ mode: TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC }),
      // Non-zero fees so the trailing row is `fees` rather than the sponsored-fee text,
      // keeping this assertion about the amount row alone.
      status: { ...mockStatus, amount: new BigNumber(0), estimatedFees: new BigNumber(100) },
    });

    expect(fields).not.toContainEqual({ type: "amount", label: "Amount" });
    expect(fields.map(f => f.type)).toEqual(["text", "address", "address", "fees"]);
  });

  it("should keep the Amount field for unbond, which does carry an amount", async () => {
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: getMockedTransaction({ mode: TRANSACTION_TYPE.UNBOND_PUBLIC }),
      status: mockStatus,
    });

    expect(fields).toContainEqual({ type: "amount", label: "Amount" });
  });

  it("should include the Fees field when estimatedFees is non-zero and sponsorship is disabled", async () => {
    const status: TransactionStatus = { ...mockStatus, estimatedFees: new BigNumber(100) };
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: mockTransaction,
      status,
    });

    expect(fields).toContainEqual({ type: "fees", label: "Fees" });
  });

  it("should include sponsored fee text when sponsorship is enabled, even when estimatedFees is zero", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...getMockedConfig("testnet"),
      isFeeSponsored: true,
    });

    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: mockTransaction,
      status: mockStatus,
    });

    expect(fields).toContainEqual({
      type: "text",
      label: "Fees",
      value: "Sponsored by Provable",
      valueI18nKey: "aleo.shared.sponsoredByProvable",
    });
    expect(fields).not.toContainEqual({ type: "fees", label: "Fees" });
  });

  // https://ledgerhq.atlassian.net/browse/LIVE-29092
  it.skip("should still include sponsored fee text when sponsorship is enabled and estimatedFees is non-zero", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...getMockedConfig("testnet"),
      isFeeSponsored: true,
    });

    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: mockTransaction,
      status: { ...mockStatus, estimatedFees: new BigNumber(100) },
    });

    expect(fields).toContainEqual({
      type: "text",
      label: "Fees",
      value: "Sponsored by Provable",
      valueI18nKey: "aleo.shared.sponsoredByProvable",
    });
    expect(fields).not.toContainEqual({ type: "fees", label: "Fees" });
  });

  it("should not include the fees field when estimatedFees is zero and sponsorship is disabled", async () => {
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: mockTransaction,
      status: mockStatus,
    });

    expect(fields).not.toContainEqual({ type: "fees", label: "Fees" });
  });

  it("should return fields in correct order", async () => {
    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: mockTransaction,
      status: { ...mockStatus, estimatedFees: new BigNumber(100) },
    });

    expect(fields.map(f => f.type)).toEqual(["text", "address", "address", "amount", "fees"]);
  });

  it("should return fields in correct order for sponsored transactions", async () => {
    mockAleoConfig.getCoinConfig.mockReturnValue({
      ...getMockedConfig("testnet"),
      isFeeSponsored: true,
    });

    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: mockTransaction,
      status: mockStatus,
    });

    expect(fields.map(f => f.type)).toEqual(["text", "address", "address", "amount", "text"]);
    expect(fields[4]).toEqual({
      type: "text",
      label: "Fees",
      value: "Sponsored by Provable",
      valueI18nKey: "aleo.shared.sponsoredByProvable",
    });
  });

  // https://ledgerhq.atlassian.net/browse/LIVE-29092
  it.skip("should resolve config for the account currency", async () => {
    await getDeviceTransactionConfig({
      account: mockAccount,
      transaction: mockTransaction,
      status: mockStatus,
    });

    expect(mockAleoConfig.getCoinConfig).toHaveBeenCalledTimes(1);
    expect(mockAleoConfig.getCoinConfig).toHaveBeenCalledWith(mockAccount.currency.id);
  });
});
