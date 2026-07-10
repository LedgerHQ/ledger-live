import { completeExchangeLogic } from "../exchange";
import * as converters from "../../converters";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import BigNumber from "bignumber.js";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  createContextContainingAccountId,
  createFixtureAccount,
  createFixtureTokenAccount,
  createWalletAPIEthereumTransaction,
  createWalletAPIBitcoinTransaction,
} from "./testHelpers";

jest.mock("../../converters", () => ({
  ...jest.requireActual("../../converters"),
  getAccountIdFromWalletAccountId: jest.fn(),
  accountToWalletAPIAccount: jest.fn(),
}));

setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

const mockedGetAccountIdFromWalletAccountId = jest.mocked(
  converters.getAccountIdFromWalletAccountId,
);

describe("completeExchangeLogic", () => {
  const mockWalletAPICompleteExchangeRequested = jest.fn();
  const context = createContextContainingAccountId({
    tracking: {
      completeExchangeRequested: mockWalletAPICompleteExchangeRequested,
    },
    accountsParams: [{ id: "11" }, { id: "12" }],
  });

  const uiNavigation = jest.fn();
  beforeEach(() => {
    mockWalletAPICompleteExchangeRequested.mockClear();
    uiNavigation.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
  });

  describe("when nominal case", () => {
    const expectedResult = "Function called";

    beforeEach(() => uiNavigation.mockResolvedValueOnce(expectedResult));

    it("calls uiNavigation callback (token)", async () => {
      const fromAccountId = "js:2:ethereum:0x16:+ethereum%2Ferc20%2Fusd_tether__erc20_";
      const toAccountId = "js:2:ethereum:0x042:";
      const fromAccount = createFixtureTokenAccount("16");
      const fromParentAccount = createFixtureAccount("16");
      context.accounts = [...context.accounts, fromAccount, fromParentAccount];
      const transaction = createWalletAPIEthereumTransaction();
      const completeExchangeRequest = {
        provider: "provider",
        fromAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f1",
        toAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f2",
        transaction,
        binaryPayload: "binaryPayload",
        signature: "signature",
        feesStrategy: "medium",
        exchangeType: 8,
      };

      const expectedTransaction: EvmTransaction = {
        family: "evm",
        amount: new BigNumber("1000000000"),
        subAccountId: fromAccountId,
        recipient: "0x0123456",
        nonce: 8,
        data: Buffer.from("Some data..."),
        type: 0,
        gasPrice: new BigNumber("700000"),
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        gasLimit: new BigNumber("1200000"),
        customGasLimit: new BigNumber("1200000"),
        feesStrategy: "medium",
        mode: "send",
        useAllAmount: false,
        chainId: 1,
      };

      mockedGetAccountIdFromWalletAccountId
        .mockReturnValueOnce(fromAccountId)
        .mockReturnValueOnce(toAccountId);

      const result = await completeExchangeLogic(context, completeExchangeRequest, uiNavigation);

      expect(uiNavigation).toHaveBeenCalledTimes(1);
      expect(uiNavigation.mock.calls[0][0]).toEqual({
        provider: "provider",
        exchange: {
          fromAccount,
          fromParentAccount,
          fromCurrency: fromAccount.token,
          toAccount: undefined,
          toParentAccount: undefined,
          toCurrency: undefined,
        },
        transaction: expectedTransaction,
        binaryPayload: "binaryPayload",
        signature: "signature",
        feesStrategy: "medium",
        exchangeType: 8,
        swapId: undefined,
        rate: undefined,
      });
      expect(result).toEqual(expectedResult);
    });

    it("calls uiNavigation callback (coin)", async () => {
      const fromAccountId = "js:2:ethereum:0x017:";
      const toAccountId = "js:2:ethereum:0x042:";
      const fromAccount = createFixtureAccount("17");
      context.accounts = [...context.accounts, fromAccount];
      const transaction = createWalletAPIEthereumTransaction();
      const completeExchangeRequest = {
        provider: "provider",
        fromAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f1",
        toAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f2",
        transaction,
        binaryPayload: "binaryPayload",
        signature: "signature",
        feesStrategy: "medium",
        exchangeType: 8,
      };

      const expectedTransaction: EvmTransaction = {
        family: "evm",
        amount: new BigNumber("1000000000"),
        recipient: "0x0123456",
        nonce: 8,
        data: Buffer.from("Some data..."),
        gasPrice: new BigNumber("700000"),
        gasLimit: new BigNumber("1200000"),
        customGasLimit: new BigNumber("1200000"),
        feesStrategy: "medium",
        mode: "send",
        useAllAmount: false,
        chainId: 1,
        subAccountId: undefined,
        type: 0,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
      };

      mockedGetAccountIdFromWalletAccountId
        .mockReturnValueOnce(fromAccountId)
        .mockReturnValueOnce(toAccountId);

      const result = await completeExchangeLogic(context, completeExchangeRequest, uiNavigation);

      expect(uiNavigation).toHaveBeenCalledTimes(1);
      expect(uiNavigation.mock.calls[0][0]).toEqual({
        provider: "provider",
        exchange: {
          fromAccount,
          fromParentAccount: undefined,
          fromCurrency: fromAccount.currency,
          toAccount: undefined,
          toParentAccount: undefined,
          toCurrency: undefined,
        },
        transaction: expectedTransaction,
        binaryPayload: "binaryPayload",
        signature: "signature",
        feesStrategy: "medium",
        exchangeType: 8,
        swapId: undefined,
        rate: undefined,
      });
      expect(result).toEqual(expectedResult);
    });

    it.each(["slow", "medium", "fast", "custom"])(
      "calls uiNavigation with a transaction that has the %s feeStrategy",
      async expectedFeeStrategy => {
        const fromAccountId = "js:2:ethereum:0x017:";
        const toAccountId = "js:2:ethereum:0x042:";
        const fromAccount = createFixtureAccount("17");
        context.accounts = [...context.accounts, fromAccount];
        const transaction = createWalletAPIEthereumTransaction();
        const completeExchangeRequest = {
          provider: "provider",
          fromAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f1",
          toAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f2",
          transaction,
          binaryPayload: "binaryPayload",
          signature: "signature",
          feesStrategy: expectedFeeStrategy,
          exchangeType: 8,
          swapId: "1234",
          rate: 1,
        };

        mockedGetAccountIdFromWalletAccountId
          .mockReturnValueOnce(fromAccountId)
          .mockReturnValueOnce(toAccountId);

        await completeExchangeLogic(context, completeExchangeRequest, uiNavigation);

        expect(uiNavigation).toHaveBeenCalledTimes(1);
        expect(uiNavigation.mock.calls[0][0]["transaction"].feesStrategy).toEqual(
          expectedFeeStrategy,
        );
      },
    );

    it("calls the tracking for success", async () => {
      const fromAccountId = "js:2:ethereum:0x012:";
      const toAccountId = "js:2:ethereum:0x042:";
      const completeExchangeRequest = {
        provider: "provider",
        fromAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f1",
        toAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f2",
        transaction: createWalletAPIEthereumTransaction(),
        binaryPayload: "binaryPayload",
        signature: "signature",
        feesStrategy: "medium",
        exchangeType: 8,
        swapId: "1234",
        rate: 1,
      };

      mockedGetAccountIdFromWalletAccountId
        .mockReturnValueOnce(fromAccountId)
        .mockReturnValueOnce(toAccountId);

      await completeExchangeLogic(context, completeExchangeRequest, uiNavigation);

      expect(mockWalletAPICompleteExchangeRequested).toHaveBeenCalledTimes(1);
    });
  });

  describe("when Account is from a different family than the transaction", () => {
    const expectedResult = "Function called";

    beforeEach(() => uiNavigation.mockResolvedValueOnce(expectedResult));

    it("returns an error", async () => {
      const fromAccountId = "js:2:ethereum:0x012:";
      const toAccountId = "js:2:ethereum:0x042:";
      const fromAccount = createFixtureAccount("17");
      context.accounts = [...context.accounts, fromAccount];
      const transaction = createWalletAPIBitcoinTransaction();
      const completeExchangeRequest = {
        provider: "provider",
        fromAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f1",
        toAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f2",
        transaction,
        binaryPayload: "binaryPayload",
        signature: "signature",
        feesStrategy: "medium",
        exchangeType: 8,
        swapId: "1234",
        rate: 1,
      };

      mockedGetAccountIdFromWalletAccountId
        .mockReturnValueOnce(fromAccountId)
        .mockReturnValueOnce(toAccountId);

      await expect(async () => {
        await completeExchangeLogic(context, completeExchangeRequest, uiNavigation);
      }).rejects.toThrow("Account and transaction must be from the same family");

      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });
  });

  describe("when resolving the to account", () => {
    it("throws when the toAccountId is unknown", async () => {
      const fromAccountId = "js:2:ethereum:0x16:";
      const completeExchangeRequest = {
        provider: "provider",
        fromAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f1",
        toAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f2",
        transaction: createWalletAPIEthereumTransaction(),
        binaryPayload: "binaryPayload",
        signature: "signature",
        feesStrategy: "medium",
        exchangeType: 8,
      };

      mockedGetAccountIdFromWalletAccountId
        .mockReturnValueOnce(fromAccountId)
        .mockReturnValueOnce("");

      await expect(
        completeExchangeLogic(context, completeExchangeRequest, uiNavigation),
      ).rejects.toThrow(`accountId ${completeExchangeRequest.toAccountId} unknown`);

      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });

    it("requires a to account for a swap when none is provided", async () => {
      const fromAccount = createFixtureAccount("16");
      context.accounts = [...context.accounts, fromAccount];
      const completeExchangeRequest = {
        provider: "provider",
        fromAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f1",
        transaction: createWalletAPIEthereumTransaction(),
        binaryPayload: "binaryPayload",
        signature: "signature",
        feesStrategy: "medium",
        exchangeType: 0x00,
      };

      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(fromAccount.id);

      await expect(
        completeExchangeLogic(context, completeExchangeRequest, uiNavigation),
      ).rejects.toThrow("To account required for swap");

      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });
  });
});
