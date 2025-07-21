import BigNumber from "bignumber.js";
import { getTransactionStatus } from "./getTransactionStatus";
import { validateRecipient } from "../logic";
import { isAccountDelegating } from "../network/bakers";
import api from "../network/tzkt";
import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  RecommendUndelegation,
} from "@ledgerhq/errors";
import { TezosAccount, Transaction } from "../types";

jest.mock("../logic", () => ({
  validateRecipient: jest.fn(),
}));

jest.mock("../network/bakers", () => ({
  isAccountDelegating: jest.fn(),
}));

jest.mock("../network/tzkt", () => ({
  getAccountByAddress: jest.fn(),
}));

describe("getTransactionStatus", () => {
  const mockAccount = {
    type: "Account",
    freshAddress: "tz1SourceAddress",
    balance: new BigNumber(1000000),
    currency: {
      type: "CryptoCurrency",
      units: [
        {
          name: "tezos",
          code: "XTZ",
          magnitude: 6,
        },
      ],
    },
    tezosResources: {
      revealed: true,
      counter: 0,
    },
  } as unknown as TezosAccount;

  const mockTransaction = {
    family: "tezos",
    mode: "send",
    amount: new BigNumber(500000),
    recipient: "tz1RecipientAddress",
    estimatedFees: new BigNumber(1000),
    useAllAmount: false,
  } as Transaction;

  beforeEach(() => {
    jest.clearAllMocks();
    (validateRecipient as jest.Mock).mockResolvedValue({
      recipientError: null,
      recipientWarning: null,
    });
    (api.getAccountByAddress as jest.Mock).mockResolvedValue({ type: "empty" });
  });

  it("should return an error if the recipient is the same as the source address", async () => {
    const transaction = { ...mockTransaction, recipient: mockAccount.freshAddress };
    const result = await getTransactionStatus(mockAccount, transaction);
    expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  it("should return an error if the amount is zero and useAllAmount is false", async () => {
    const transaction = { ...mockTransaction, amount: new BigNumber(0) };
    const result = await getTransactionStatus(mockAccount, transaction);
    expect(result.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("should return a warning if the fees are too high compared to the amount", async () => {
    const transaction = { ...mockTransaction, amount: new BigNumber(1000) };
    const result = await getTransactionStatus(mockAccount, transaction);
    expect(result.warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
  });

  it("should return a warning if the balance after transaction is below the threshold", async () => {
    (isAccountDelegating as jest.Mock).mockReturnValue(true);
    const transaction = { ...mockTransaction, amount: new BigNumber(999000) };
    const result = await getTransactionStatus(mockAccount, transaction);
    expect(result.warnings.amount).toBeInstanceOf(RecommendUndelegation);
  });

  it("should map taquito errors to appropriate errors", async () => {
    const transaction = { ...mockTransaction, taquitoError: "balance_too_low" };
    const result = await getTransactionStatus(mockAccount, transaction);
    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should return an error if the account balance is zero or less", async () => {
    const account = { ...mockAccount, balance: new BigNumber(0) };
    const result = await getTransactionStatus(account, mockTransaction);
    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should return an error if the account balance is less than the estimated fees for delegation", async () => {
    const transaction = { ...mockTransaction, mode: "delegate" } as Transaction;
    const account = { ...mockAccount, balance: new BigNumber(500) };
    const result = await getTransactionStatus(account, transaction);
    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should return an error if the recipient account is empty and the amount is below the existential deposit", async () => {
    const transaction = { ...mockTransaction, amount: new BigNumber(100000) };
    const result = await getTransactionStatus(mockAccount, transaction);
    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalanceBecauseDestinationNotCreated);
  });

  it("should return no errors or warnings for a valid transaction", async () => {
    const account = { ...mockAccount, balance: new BigNumber(2000000) };
    const transaction = { ...mockTransaction, amount: new BigNumber(500000) };
    const result = await getTransactionStatus(account, transaction);
    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
  });
});
