import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { validateAddress } from "../dfinity/validation";
import { Transaction } from "../types";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../dfinity/validation");

const mockValidateAddress = jest.mocked(validateAddress);

describe("prepareTransaction", () => {
  beforeEach(() => {
    mockValidateAddress.mockReset();
  });

  const makeAccount = (overrides: Partial<Account> = {}) =>
    ({
      freshAddress: "sender-address",
      freshAddressPath: "44'/223'/0'/0/0",
      spendableBalance: new BigNumber(100000),
      ...overrides,
    }) as Account;

  it("should return the transaction unchanged when recipient is empty", async () => {
    const account = makeAccount();
    const tx: Transaction = {
      family: "internet_computer",
      amount: new BigNumber(50000),
      fees: new BigNumber(10000),
      recipient: "",
      useAllAmount: false,
    };

    const result = await prepareTransaction(account, tx);
    expect(result).toBe(tx);
  });

  it("should return the transaction unchanged when addresses are invalid", async () => {
    mockValidateAddress.mockResolvedValue({ isValid: false } as any);

    const account = makeAccount();
    const tx: Transaction = {
      family: "internet_computer",
      amount: new BigNumber(50000),
      fees: new BigNumber(10000),
      recipient: "invalid-addr",
      useAllAmount: false,
    };

    const result = await prepareTransaction(account, tx);
    expect(result).toBe(tx);
  });

  it("should compute amount = spendableBalance - fees when useAllAmount is true", async () => {
    mockValidateAddress.mockResolvedValue({ isValid: true } as any);

    const account = makeAccount({ spendableBalance: new BigNumber(100000) });
    const tx: Transaction = {
      family: "internet_computer",
      amount: new BigNumber(0),
      fees: new BigNumber(10000),
      recipient: "valid-recipient",
      useAllAmount: true,
    };

    const result = await prepareTransaction(account, tx);
    expect(result.amount).toEqual(new BigNumber(90000));
    expect(result.useAllAmount).toBe(true);
  });

  it("should return the original transaction when useAllAmount is false", async () => {
    mockValidateAddress.mockResolvedValue({ isValid: true } as any);

    const account = makeAccount();
    const tx: Transaction = {
      family: "internet_computer",
      amount: new BigNumber(50000),
      fees: new BigNumber(10000),
      recipient: "valid-recipient",
      useAllAmount: false,
    };

    const result = await prepareTransaction(account, tx);
    expect(result).toBe(tx);
  });
});
