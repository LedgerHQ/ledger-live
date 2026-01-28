import getDeviceTransactionConfig from "./deviceTransactionConfig";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "../types";
import BigNumber from "bignumber.js";
import { validateAddress } from "../network";

jest.mock("../network", () => ({
  validateAddress: jest.fn(),
  getEquivalentAddress: jest.fn(() => ""),
}));

const mockedValidateAddress = validateAddress as jest.MockedFunction<typeof validateAddress>;

describe("getDeviceTransactionConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAccount: Account = {
    id: "js:2:filecoin:f1test:filecoin",
    type: "Account",
    freshAddress: "f1test",
    currency: {
      id: "filecoin",
      name: "Filecoin",
      ticker: "FIL",
      units: [{ name: "FIL", code: "FIL", magnitude: 18 }],
    },
  } as Account;

  const mockTransaction: Transaction = {
    family: "filecoin",
    amount: new BigNumber("1000000000000000000"),
    method: 0,
    version: 0,
    nonce: 1,
    gasLimit: new BigNumber("1000000"),
    gasFeeCap: new BigNumber("100000"),
    gasPremium: new BigNumber("50000"),
    recipient: "f1recipient",
    useAllAmount: false,
  };

  const mockStatus: TransactionStatus = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber("100000000000"),
    amount: new BigNumber("1000000000000000000"),
    totalSpent: new BigNumber("1100000000000000000"),
  };

  it("should return gas fields for native transfer", async () => {
    mockedValidateAddress.mockReturnValue({ isValid: false });

    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      parentAccount: null,
      transaction: mockTransaction,
      status: mockStatus,
    });

    const fieldTypes = fields.map(f => f.type);
    expect(fieldTypes).toContain("filecoin.gasLimit");
    expect(fieldTypes).toContain("filecoin.gasFeeCap");
    expect(fieldTypes).toContain("filecoin.gasPremium");
    expect(fieldTypes).toContain("filecoin.method");
  });

  it("should include recipient field for 0xff prefixed addresses", async () => {
    const txWith0xff: Transaction = {
      ...mockTransaction,
      recipient: "0xff1234567890123456789012345678901234567890",
    };

    mockedValidateAddress.mockReturnValue({
      isValid: true,
      parsedAddress: { toString: () => "f410fconverted" },
    } as never);

    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      parentAccount: null,
      transaction: txWith0xff,
      status: mockStatus,
    });

    const recipientField = fields.find(f => f.type === "filecoin.recipient");
    expect(recipientField).toBeDefined();
    expect(recipientField?.value).toBe("f410fconverted");
  });

  it("should return token transfer fields for TokenAccount", async () => {
    const mockTokenAccount: TokenAccount = {
      id: "js:2:filecoin:f1test:filecoin+erc20:contract",
      type: "TokenAccount",
      token: {
        id: "filecoin/erc20/contract",
        name: "TestToken",
        ticker: "TKN",
        contractAddress: "0x1234567890123456789012345678901234567890",
      },
    } as TokenAccount;

    const fields = await getDeviceTransactionConfig({
      account: mockTokenAccount,
      parentAccount: mockAccount,
      transaction: mockTransaction,
      status: mockStatus,
    });

    const fieldTypes = fields.map(f => f.type);

    // For token transfers: recipient, gasLimit, method
    expect(fieldTypes).toContain("filecoin.recipient");
    expect(fieldTypes).toContain("filecoin.gasLimit");
    expect(fieldTypes).toContain("filecoin.method");

    // Should not have gasFeeCap and gasPremium for token transfers
    expect(fieldTypes).not.toContain("filecoin.gasFeeCap");
    expect(fieldTypes).not.toContain("filecoin.gasPremium");
  });

  it("should use parent account unit when parentAccount is provided", async () => {
    mockedValidateAddress.mockReturnValue({ isValid: false });

    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      parentAccount: {
        ...mockAccount,
        currency: {
          ...mockAccount.currency,
          units: [{ name: "FIL", code: "FIL", magnitude: 18 }],
        },
      } as Account,
      transaction: mockTransaction,
      status: mockStatus,
    });

    expect(fields.length).toBeGreaterThan(0);
  });

  it("should format method as Transfer for method 0", async () => {
    mockedValidateAddress.mockReturnValue({ isValid: false });

    const fields = await getDeviceTransactionConfig({
      account: mockAccount,
      parentAccount: null,
      transaction: mockTransaction,
      status: mockStatus,
    });

    const methodField = fields.find(f => f.type === "filecoin.method");
    expect(methodField?.value).toBe("Transfer");
  });
});
