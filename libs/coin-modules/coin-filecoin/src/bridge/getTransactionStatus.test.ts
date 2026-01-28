import { getTransactionStatus } from "./getTransactionStatus";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import BigNumber from "bignumber.js";
import { validateAddress, isRecipientValidForTokenTransfer } from "../network";
import { getAddress, getSubAccount } from "../common-logic";

jest.mock("../network", () => ({
  validateAddress: jest.fn(),
  isRecipientValidForTokenTransfer: jest.fn(),
}));

jest.mock("../common-logic", () => ({
  getAddress: jest.fn(),
  getSubAccount: jest.fn(),
}));

const mockedValidateAddress = validateAddress as jest.MockedFunction<typeof validateAddress>;
const mockedGetAddress = getAddress as jest.MockedFunction<typeof getAddress>;
const mockedGetSubAccount = getSubAccount as jest.MockedFunction<typeof getSubAccount>;
const mockedIsRecipientValidForTokenTransfer =
  isRecipientValidForTokenTransfer as jest.MockedFunction<typeof isRecipientValidForTokenTransfer>;

describe("getTransactionStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAddress.mockReturnValue({ address: "f1sender", derivationPath: "m/44'/461'/0'/0/0" });
    mockedGetSubAccount.mockReturnValue(null);
    mockedValidateAddress.mockReturnValue({ isValid: true, parsedAddress: {} } as never);
    mockedIsRecipientValidForTokenTransfer.mockReturnValue(true);
  });

  const mockAccount: Account = {
    id: "js:2:filecoin:f1sender:filecoin",
    type: "Account",
    freshAddress: "f1sender",
    balance: new BigNumber("10000000000000000000"),
    spendableBalance: new BigNumber("10000000000000000000"),
    currency: {
      id: "filecoin",
      name: "Filecoin",
      ticker: "FIL",
    },
  } as Account;

  const validTransaction: Transaction = {
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

  it("should return no errors for valid transaction", async () => {
    const status = await getTransactionStatus(mockAccount, validTransaction);

    expect(Object.keys(status.errors)).toHaveLength(0);
    expect(status.amount).toEqual(validTransaction.amount);
    expect(status.estimatedFees.toString()).toBe("100000000000");
  });

  it("should return RecipientRequired when recipient is empty", async () => {
    const tx: Transaction = { ...validTransaction, recipient: "" };

    const status = await getTransactionStatus(mockAccount, tx);

    expect(status.errors.recipient).toBeDefined();
    expect(status.errors.recipient.name).toBe("RecipientRequired");
  });

  it("should return InvalidAddress when recipient is invalid", async () => {
    mockedValidateAddress.mockImplementation(addr => {
      if (addr === "invalid") return { isValid: false };
      return { isValid: true, parsedAddress: {} } as never;
    });

    const tx: Transaction = { ...validTransaction, recipient: "invalid" };

    const status = await getTransactionStatus(mockAccount, tx);

    expect(status.errors.recipient).toBeDefined();
    expect(status.errors.recipient.name).toBe("InvalidAddress");
  });

  it("should return InvalidAddress when sender address is invalid", async () => {
    mockedValidateAddress.mockImplementation(addr => {
      if (addr === "f1sender") return { isValid: false };
      return { isValid: true, parsedAddress: {} } as never;
    });

    const status = await getTransactionStatus(mockAccount, validTransaction);

    expect(status.errors.sender).toBeDefined();
    expect(status.errors.sender.name).toBe("InvalidAddress");
  });

  it("should return FeeNotLoaded when gas params are zero", async () => {
    const tx: Transaction = {
      ...validTransaction,
      gasFeeCap: new BigNumber(0),
      gasPremium: new BigNumber(0),
      gasLimit: new BigNumber(0),
    };

    const status = await getTransactionStatus(mockAccount, tx);

    expect(status.errors.gas).toBeDefined();
    expect(status.errors.gas.name).toBe("FeeNotLoaded");
  });

  it("should return AmountRequired when amount is zero", async () => {
    const tx: Transaction = { ...validTransaction, amount: new BigNumber(0) };

    const status = await getTransactionStatus(mockAccount, tx);

    expect(status.errors.amount).toBeDefined();
    expect(status.errors.amount.name).toBe("AmountRequired");
  });

  it("should return NotEnoughBalance when amount + fees exceeds balance", async () => {
    const tx: Transaction = {
      ...validTransaction,
      amount: new BigNumber("100000000000000000000"), // More than balance
    };

    const status = await getTransactionStatus(mockAccount, tx);

    expect(status.errors.amount).toBeDefined();
    expect(status.errors.amount.name).toBe("NotEnoughBalance");
  });

  it("should handle useAllAmount for native transfers", async () => {
    const tx: Transaction = { ...validTransaction, useAllAmount: true };

    const status = await getTransactionStatus(mockAccount, tx);

    expect(Object.keys(status.errors)).toHaveLength(0);
    expect(status.totalSpent).toEqual(mockAccount.spendableBalance);
  });

  it("should handle token account transfers", async () => {
    const mockTokenAccount: TokenAccount = {
      id: "js:2:filecoin:f1sender:filecoin+erc20:contract",
      type: "TokenAccount",
      spendableBalance: new BigNumber("5000000000000000000"),
      token: {
        id: "filecoin/erc20/contract",
        name: "TestToken",
        contractAddress: "0x1234",
      },
    } as TokenAccount;

    mockedGetSubAccount.mockReturnValue(mockTokenAccount);

    const tx: Transaction = {
      ...validTransaction,
      subAccountId: mockTokenAccount.id,
    };

    const status = await getTransactionStatus(mockAccount, tx);

    expect(Object.keys(status.errors)).toHaveLength(0);
  });

  it("should return error for invalid token recipient", async () => {
    const mockTokenAccount: TokenAccount = {
      id: "js:2:filecoin:f1sender:filecoin+erc20:contract",
      type: "TokenAccount",
      spendableBalance: new BigNumber("5000000000000000000"),
      token: {
        id: "filecoin/erc20/contract",
        name: "TestToken",
        contractAddress: "0x1234",
      },
    } as TokenAccount;

    mockedGetSubAccount.mockReturnValue(mockTokenAccount);
    mockedIsRecipientValidForTokenTransfer.mockReturnValue(false);

    const tx: Transaction = {
      ...validTransaction,
      subAccountId: mockTokenAccount.id,
    };

    const status = await getTransactionStatus(mockAccount, tx);

    expect(status.errors.recipient).toBeDefined();
    expect(status.errors.recipient.name).toBe("InvalidRecipientForTokenTransfer");
  });

  it("should calculate correct estimatedFees", async () => {
    const tx: Transaction = {
      ...validTransaction,
      gasFeeCap: new BigNumber("200000"),
      gasLimit: new BigNumber("2000000"),
    };

    const status = await getTransactionStatus(mockAccount, tx);

    // estimatedFees = gasFeeCap * gasLimit = 200000 * 2000000 = 400000000000
    expect(status.estimatedFees.toString()).toBe("400000000000");
  });
});
