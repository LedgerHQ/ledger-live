import { prepareTransaction } from "./prepareTransaction";
import { getFees } from "./api";
import { MultiversXEncodeTransaction } from "./encode";
import { BigNumber } from "bignumber.js";
import type { MultiversXAccount, Transaction } from "./types";
import { GAS } from "./constants";

jest.mock("./api", () => ({
  getFees: jest.fn(),
}));

jest.mock("./encode", () => ({
  MultiversXEncodeTransaction: {
    delegate: jest.fn(() => "delegate_encoded"),
    claimRewards: jest.fn(() => "claimRewards_encoded"),
    withdraw: jest.fn(() => "withdraw_encoded"),
    reDelegateRewards: jest.fn(() => "reDelegateRewards_encoded"),
    unDelegate: jest.fn(() => "unDelegate_encoded"),
    ESDTTransfer: jest.fn(() => Promise.resolve("esdt_transfer_encoded")),
  },
}));

jest.mock("./logic", () => ({
  isAmountSpentFromBalance: jest.fn(),
}));

const { isAmountSpentFromBalance } = jest.requireMock("./logic");

describe("prepareTransaction", () => {
  const mockGetFees = getFees as jest.MockedFunction<typeof getFees>;

  const createAccount = (overrides = {}): MultiversXAccount =>
    ({
      id: "account1",
      freshAddress: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
      spendableBalance: new BigNumber("10000000000000000000"),
      currency: {
        name: "MultiversX",
        units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
      },
      multiversxResources: {
        nonce: 1,
        delegations: [],
        isGuarded: false,
      },
      subAccounts: [],
      ...overrides,
    }) as unknown as MultiversXAccount;

  const createTransaction = (overrides = {}): Transaction => ({
    family: "multiversx",
    mode: "send",
    amount: new BigNumber("1000000000000000000"),
    recipient: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    useAllAmount: false,
    fees: null,
    gasLimit: 50000,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFees.mockResolvedValue(new BigNumber("50000000000000"));
    isAmountSpentFromBalance.mockReturnValue(true);
  });

  describe("send mode", () => {
    it("prepares simple send transaction", async () => {
      const account = createAccount();
      const transaction = createTransaction({ mode: "send" });

      const result = await prepareTransaction(account, transaction);

      expect(result.fees).toEqual(new BigNumber("50000000000000"));
      expect(mockGetFees).toHaveBeenCalledWith(expect.objectContaining({ mode: "send" }));
    });

    it("calculates max amount for useAllAmount", async () => {
      isAmountSpentFromBalance.mockReturnValue(true);
      const account = createAccount();
      const transaction = createTransaction({ mode: "send", useAllAmount: true });

      const result = await prepareTransaction(account, transaction);

      expect(result.amount).toEqual(account.spendableBalance.minus(result.fees!));
    });

    it("sets amount to 0 when fees exceed balance with useAllAmount", async () => {
      mockGetFees.mockResolvedValue(new BigNumber("20000000000000000000")); // More than balance
      isAmountSpentFromBalance.mockReturnValue(true);
      const account = createAccount();
      const transaction = createTransaction({ mode: "send", useAllAmount: true });

      const result = await prepareTransaction(account, transaction);

      expect(result.amount).toEqual(new BigNumber(0));
    });
  });

  describe("delegate mode", () => {
    it("prepares delegate transaction", async () => {
      const account = createAccount();
      const transaction = createTransaction({ mode: "delegate" });

      const result = await prepareTransaction(account, transaction);

      expect(result.gasLimit).toBe(GAS.DELEGATE);
      expect(result.data).toBe("delegate_encoded");
      expect(MultiversXEncodeTransaction.delegate).toHaveBeenCalled();
    });
  });

  describe("claimRewards mode", () => {
    it("prepares claimRewards transaction", async () => {
      const account = createAccount();
      const transaction = createTransaction({ mode: "claimRewards" });

      const result = await prepareTransaction(account, transaction);

      expect(result.gasLimit).toBe(GAS.CLAIM);
      expect(result.data).toBe("claimRewards_encoded");
      expect(MultiversXEncodeTransaction.claimRewards).toHaveBeenCalled();
    });
  });

  describe("withdraw mode", () => {
    it("prepares withdraw transaction", async () => {
      const account = createAccount();
      const transaction = createTransaction({ mode: "withdraw" });

      const result = await prepareTransaction(account, transaction);

      expect(result.gasLimit).toBe(GAS.DELEGATE);
      expect(result.data).toBe("withdraw_encoded");
      expect(MultiversXEncodeTransaction.withdraw).toHaveBeenCalled();
    });
  });

  describe("reDelegateRewards mode", () => {
    it("prepares reDelegateRewards transaction", async () => {
      const account = createAccount();
      const transaction = createTransaction({ mode: "reDelegateRewards" });

      const result = await prepareTransaction(account, transaction);

      expect(result.gasLimit).toBe(GAS.DELEGATE);
      expect(result.data).toBe("reDelegateRewards_encoded");
      expect(MultiversXEncodeTransaction.reDelegateRewards).toHaveBeenCalled();
    });
  });

  describe("unDelegate mode", () => {
    it("prepares unDelegate transaction", async () => {
      const account = createAccount();
      const transaction = createTransaction({ mode: "unDelegate" });

      const result = await prepareTransaction(account, transaction);

      expect(result.gasLimit).toBe(GAS.DELEGATE);
      expect(result.data).toBe("unDelegate_encoded");
      expect(MultiversXEncodeTransaction.unDelegate).toHaveBeenCalledWith(expect.objectContaining({ mode: "unDelegate" }));
    });
  });

  describe("unsupported mode", () => {
    it("throws error for unsupported mode", async () => {
      const account = createAccount();
      const transaction = createTransaction({ mode: "unsupportedMode" as any });

      await expect(prepareTransaction(account, transaction)).rejects.toThrow(
        "Unsupported transaction mode: unsupportedMode",
      );
    });
  });

  describe("ESDT token transfer", () => {
    it("prepares ESDT transfer transaction", async () => {
      const tokenAccount = {
        id: "token1",
        type: "TokenAccount",
        balance: new BigNumber("5000000000"),
        token: {
          id: "multiversx/esdt/token1",
          ticker: "TOKEN",
        },
      };
      const account = createAccount({
        subAccounts: [tokenAccount],
      });
      const transaction = createTransaction({
        subAccountId: "token1",
      });

      const result = await prepareTransaction(account, transaction);

      expect(result.gasLimit).toBe(GAS.ESDT_TRANSFER);
      expect(result.data).toBe("esdt_transfer_encoded");
      expect(MultiversXEncodeTransaction.ESDTTransfer).toHaveBeenCalled();
    });

    it("returns token balance for useAllAmount with token", async () => {
      const tokenAccount = {
        id: "token1",
        type: "TokenAccount",
        balance: new BigNumber("5000000000"),
        token: {
          id: "multiversx/esdt/token1",
          ticker: "TOKEN",
        },
      };
      const account = createAccount({
        subAccounts: [tokenAccount],
      });
      const transaction = createTransaction({
        subAccountId: "token1",
        useAllAmount: true,
      });

      const result = await prepareTransaction(account, transaction);

      expect(result.amount).toEqual(tokenAccount.balance);
    });
  });

  describe("useAllAmount without amount spent from balance", () => {
    it("does not subtract fees from amount when mode does not spend from balance", async () => {
      isAmountSpentFromBalance.mockReturnValue(false);
      const account = createAccount();
      const transaction = createTransaction({ mode: "claimRewards", useAllAmount: true });

      const result = await prepareTransaction(account, transaction);

      expect(result.amount).toEqual(account.spendableBalance);
    });
  });
});
