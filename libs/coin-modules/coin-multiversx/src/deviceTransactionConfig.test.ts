import getDeviceTransactionConfig from "./deviceTransactionConfig";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionStatus } from "./types";
import type { Account } from "@ledgerhq/types-live";

jest.mock("@ledgerhq/coin-framework/account", () => ({
  decodeTokenAccountId: jest.fn(),
  getAccountCurrency: jest.fn(() => ({
    units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
  })),
}));

jest.mock("@ledgerhq/coin-framework/currencies", () => ({
  formatCurrencyUnit: jest.fn(() => "0 EGLD"),
}));

jest.mock("./logic", () => ({
  isAmountSpentFromBalance: jest.fn(),
}));

const { decodeTokenAccountId } = jest.requireMock("@ledgerhq/coin-framework/account");
const { isAmountSpentFromBalance } = jest.requireMock("./logic");

describe("deviceTransactionConfig", () => {
  const createAccount = (): Account =>
    ({
      id: "account1",
      freshAddress: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
      currency: {
        name: "MultiversX",
        units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
      },
    }) as unknown as Account;

  const createTransaction = (overrides = {}): Transaction => ({
    family: "multiversx",
    mode: "send",
    amount: new BigNumber("1000000000000000000"),
    recipient: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    useAllAmount: false,
    fees: new BigNumber("50000000000000"),
    gasLimit: 50000,
    ...overrides,
  });

  const createStatus = (overrides = {}): TransactionStatus => ({
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber("50000000000000"),
    amount: new BigNumber("1000000000000000000"),
    totalSpent: new BigNumber("1000050000000000000"),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    isAmountSpentFromBalance.mockReturnValue(true);
  });

  describe("EGLD transfer", () => {
    it("returns receiver and amount fields for send mode", async () => {
      const account = createAccount();
      const transaction = createTransaction({ mode: "send" });
      const status = createStatus();

      const fields = await getDeviceTransactionConfig({ account, transaction, status });

      expect(fields).toContainEqual({
        type: "address",
        label: "Receiver",
        address: transaction.recipient,
      });
      expect(fields).toContainEqual({
        type: "amount",
        label: "Amount",
      });
    });

    it("includes fee field when fees are non-zero", async () => {
      const account = createAccount();
      const transaction = createTransaction();
      const status = createStatus();

      const fields = await getDeviceTransactionConfig({ account, transaction, status });

      expect(fields).toContainEqual({
        type: "fees",
        label: "Fee",
      });
    });

    it("excludes fee field when fees are zero", async () => {
      const account = createAccount();
      const transaction = createTransaction();
      const status = createStatus({ estimatedFees: new BigNumber(0) });

      const fields = await getDeviceTransactionConfig({ account, transaction, status });

      expect(fields).not.toContainEqual({
        type: "fees",
        label: "Fee",
      });
    });

    it("shows zero amount for modes that do not spend from balance", async () => {
      isAmountSpentFromBalance.mockReturnValue(false);
      const account = createAccount();
      const transaction = createTransaction({ mode: "claimRewards" });
      const status = createStatus();

      const fields = await getDeviceTransactionConfig({ account, transaction, status });

      expect(fields).toContainEqual({
        type: "text",
        label: "Amount",
        value: "0 EGLD",
      });
    });
  });

  describe("ESDT transfer", () => {
    it("returns token, value, and receiver fields for ESDT transfer", async () => {
      decodeTokenAccountId.mockResolvedValue({
        token: {
          name: "USDC",
          ticker: "USDC",
        },
      });

      const account = createAccount();
      const transaction = createTransaction({ subAccountId: "token1" });
      const status = createStatus();

      const fields = await getDeviceTransactionConfig({ account, transaction, status });

      expect(fields).toContainEqual({
        type: "text",
        label: "Token",
        value: "USDC",
      });
      expect(fields).toContainEqual({
        type: "amount",
        label: "Value",
      });
      expect(fields).toContainEqual({
        type: "address",
        label: "Receiver",
        address: transaction.recipient,
      });
    });

    it("handles ESDT transfer with null token", async () => {
      decodeTokenAccountId.mockResolvedValue({
        token: null,
      });

      const account = createAccount();
      const transaction = createTransaction({ subAccountId: "token1" });
      const status = createStatus();

      const fields = await getDeviceTransactionConfig({ account, transaction, status });

      // Should not include Token field when token is null
      expect(fields).not.toContainEqual(expect.objectContaining({ label: "Token" }));
    });

    it("handles undefined subAccountId as non-ESDT transfer", async () => {
      const account = createAccount();
      const transaction = createTransaction({ subAccountId: undefined });
      const status = createStatus();

      const fields = await getDeviceTransactionConfig({ account, transaction, status });

      expect(decodeTokenAccountId).not.toHaveBeenCalled();
      expect(fields).not.toContainEqual(expect.objectContaining({ label: "Token" }));
    });

    it("handles null subAccountId as non-ESDT transfer", async () => {
      const account = createAccount();
      const transaction = createTransaction({ subAccountId: null });
      const status = createStatus();

      const fields = await getDeviceTransactionConfig({ account, transaction, status });

      expect(decodeTokenAccountId).not.toHaveBeenCalled();
    });
  });

  describe("delegation modes", () => {
    it("returns fields for delegate mode", async () => {
      const account = createAccount();
      const transaction = createTransaction({ mode: "delegate" });
      const status = createStatus();

      const fields = await getDeviceTransactionConfig({ account, transaction, status });

      expect(fields).toContainEqual({
        type: "address",
        label: "Receiver",
        address: transaction.recipient,
      });
    });

    it("returns fields for unDelegate mode", async () => {
      const account = createAccount();
      const transaction = createTransaction({ mode: "unDelegate" });
      const status = createStatus();

      const fields = await getDeviceTransactionConfig({ account, transaction, status });

      expect(fields.length).toBeGreaterThan(0);
    });
  });
});
