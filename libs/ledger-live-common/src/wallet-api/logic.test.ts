import {
  bitcoinFamilyAccountGetAddressLogic,
  bitcoinFamilyAccountGetAddressesLogic,
  bitcoinFamilyAccountGetPublicKeyLogic,
  bitcoinFamilyAccountGetXPubLogic,
  broadcastTransactionLogic,
  completeExchangeLogic,
  receiveOnAccountLogic,
  signMessageLogic,
  WalletAPIContext,
} from "./logic";

import { AppManifest, WalletAPITransaction } from "./types";
import {
  createFixtureAccount,
  createFixtureCryptoCurrency,
  createFixtureTokenAccount,
} from "../mock/fixtures/cryptoCurrencies";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { OperationType, SignedOperation, TokenAccount } from "@ledgerhq/types-live";
import { getWalletAccount } from "@ledgerhq/coin-bitcoin/lib/wallet-btc/index";
import BigNumber from "bignumber.js";

import * as converters from "./converters";
import * as signMessage from "../hw/signMessage/index";

jest.mock("./converters", () => ({
  ...jest.requireActual("./converters"),
  getAccountIdFromWalletAccountId: jest.fn(),
  accountToWalletAPIAccount: jest.fn(),
}));

jest.mock("../hw/signMessage/index", () => ({
  ...jest.requireActual("../hw/signMessage/index"),
  prepareMessageToSign: jest.fn(),
}));
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { TrackingAPI } from "./tracking";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";
import { setSupportedCurrencies } from "../currencies";
import { initialState as walletState } from "@ledgerhq/live-wallet/store";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";

// Setup mock store for unit tests
setupMockCryptoAssetsStore();

// Global mocked functions
const mockedGetAccountIdFromWalletAccountId = jest.mocked(
  converters.getAccountIdFromWalletAccountId,
);
const mockedAccountToWalletAPIAccount = jest.mocked(converters.accountToWalletAPIAccount);
const mockedPrepareMessageToSign = jest.mocked(signMessage.prepareMessageToSign);
const mockedGetWalletAccount = jest.mocked(getWalletAccount);

describe("receiveOnAccountLogic", () => {
  // Given
  const mockWalletAPIReceiveRequested = jest.fn();
  const mockWalletAPIReceiveFail = jest.fn();

  const context = createContextContainingAccountId({
    tracking: {
      receiveRequested: mockWalletAPIReceiveRequested,
      receiveFail: mockWalletAPIReceiveFail,
    },
    accountsParams: [{ id: "11" }, { id: "12" }],
  });

  const uiNavigation = jest.fn();

  beforeEach(() => {
    mockWalletAPIReceiveRequested.mockClear();
    mockWalletAPIReceiveFail.mockClear();
    uiNavigation.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
    mockedAccountToWalletAPIAccount.mockClear();
    // Default implementation for accountToWalletAPIAccount
    mockedAccountToWalletAPIAccount.mockImplementation((_walletState, _account, _parentAccount) => {
      return createWalletAPIAccount();
    });
  });

  describe("when nominal case", () => {
    // Given
    const accountId = "js:2:ethereum:0x012:";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
    const expectedResult = "Function called";

    beforeEach(() => {
      uiNavigation.mockResolvedValueOnce(expectedResult);
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);
    });

    it("calls uiNavigation callback with an accountAddress", async () => {
      // Given
      const convertedAccount = {
        ...createWalletAPIAccount(),
        address: "Converted address",
      };
      mockedAccountToWalletAPIAccount.mockReturnValueOnce(convertedAccount);

      // When
      const result = await receiveOnAccountLogic(
        walletState,
        context,
        walletAccountId,
        uiNavigation,
      );

      // Then
      expect(uiNavigation).toHaveBeenCalledTimes(1);
      expect(uiNavigation.mock.calls[0][2]).toEqual("Converted address");
      expect(result).toEqual(expectedResult);
    });

    it("calls the tracking for success", async () => {
      // When
      await receiveOnAccountLogic(walletState, context, walletAccountId, uiNavigation);

      // Then
      expect(mockWalletAPIReceiveRequested).toHaveBeenCalledTimes(1);
      expect(mockWalletAPIReceiveFail).toHaveBeenCalledTimes(0);
    });
  });

  describe("when account cannot be found", () => {
    // Given
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(undefined);
    });

    it("returns an error", async () => {
      // When
      await expect(async () => {
        await receiveOnAccountLogic(walletState, context, walletAccountId, uiNavigation);
      }).rejects.toThrow(`accountId ${walletAccountId} unknown`);

      // Then
      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      // When
      await expect(async () => {
        await receiveOnAccountLogic(walletState, context, walletAccountId, uiNavigation);
      }).rejects.toThrow();

      // Then
      expect(mockWalletAPIReceiveRequested).toHaveBeenCalledTimes(1);
      expect(mockWalletAPIReceiveFail).toHaveBeenCalledTimes(1);
    });
  });
});

function createWalletAPIEtherumTransaction(): WalletAPITransaction {
  return {
    family: "ethereum",
    amount: BigNumber(1000000000),
    recipient: "0x0123456",
    nonce: 8,
    data: Buffer.from("Some data..."),
    gasPrice: BigNumber(700000),
    gasLimit: BigNumber(1200000),
  };
}

function createWalletAPIBitcoinTransaction(): WalletAPITransaction {
  return {
    family: "bitcoin",
    amount: BigNumber(1000000000),
    recipient: "0x0123456",
    feePerByte: BigNumber(900000),
  };
}

describe("completeExchangeLogic", () => {
  // Given
  const mockWalletAPICompleteExchangeRequested = jest.fn();
  const context = createContextContainingAccountId({
    tracking: {
      completeExchangeRequested: mockWalletAPICompleteExchangeRequested,
    },
    accountsParams: [{ id: "11" }, { id: "12" }],
  });

  const uiNavigation = jest.fn();
  beforeAll(() => {
    setSupportedCurrencies(["bitcoin", "ethereum"]);
  });
  afterAll(() => {
    setSupportedCurrencies([]);
  });

  beforeEach(() => {
    mockWalletAPICompleteExchangeRequested.mockClear();
    uiNavigation.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
  });

  describe("when nominal case", () => {
    // Given
    const expectedResult = "Function called";

    beforeEach(() => uiNavigation.mockResolvedValueOnce(expectedResult));

    it("calls uiNavigation callback (token)", async () => {
      // Given
      const fromAccountId = "js:2:ethereum:0x16:+ethereum%2Ferc20%2Fusd_tether__erc20_";
      const toAccountId = "js:2:ethereum:0x042:";
      const fromAccount = createFixtureTokenAccount("16");
      const fromParentAccount = createFixtureAccount("16");
      context.accounts = [...context.accounts, fromAccount, fromParentAccount];
      const transaction = createWalletAPIEtherumTransaction();
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

      // When
      const result = await completeExchangeLogic(context, completeExchangeRequest, uiNavigation);

      // Then
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
      // Given
      const fromAccountId = "js:2:ethereum:0x017:";
      const toAccountId = "js:2:ethereum:0x042:";
      const fromAccount = createFixtureAccount("17");
      context.accounts = [...context.accounts, fromAccount];
      const transaction = createWalletAPIEtherumTransaction();
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

      // When
      const result = await completeExchangeLogic(context, completeExchangeRequest, uiNavigation);

      // Then
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
        // Given
        const fromAccountId = "js:2:ethereum:0x017:";
        const toAccountId = "js:2:ethereum:0x042:";
        const fromAccount = createFixtureAccount("17");
        context.accounts = [...context.accounts, fromAccount];
        const transaction = createWalletAPIEtherumTransaction();
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

        // When
        await completeExchangeLogic(context, completeExchangeRequest, uiNavigation);

        // Then
        expect(uiNavigation).toHaveBeenCalledTimes(1);
        expect(uiNavigation.mock.calls[0][0]["transaction"].feesStrategy).toEqual(
          expectedFeeStrategy,
        );
      },
    );

    it("calls the tracking for success", async () => {
      // Given
      const fromAccountId = "js:2:ethereum:0x012:";
      const toAccountId = "js:2:ethereum:0x042:";
      const completeExchangeRequest = {
        provider: "provider",
        fromAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f1",
        toAccountId: "806ea21d-f5f0-425a-add3-39d4b78209f2",
        transaction: createWalletAPIEtherumTransaction(),
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

      // When
      await completeExchangeLogic(context, completeExchangeRequest, uiNavigation);

      // Then
      expect(mockWalletAPICompleteExchangeRequested).toHaveBeenCalledTimes(1);
    });
  });

  describe("when Account is from a different family than the transaction", () => {
    // Given
    const expectedResult = "Function called";

    beforeEach(() => uiNavigation.mockResolvedValueOnce(expectedResult));

    it("returns an error", async () => {
      // Given
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

      // When
      await expect(async () => {
        await completeExchangeLogic(context, completeExchangeRequest, uiNavigation);
      }).rejects.toThrow("Account and transaction must be from the same family");

      // Then
      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });
  });
});

describe("broadcastTransactionLogic", () => {
  // Given
  const mockWalletAPIBroadcastFail = jest.fn();

  const context = createContextContainingAccountId({
    tracking: {
      broadcastFail: mockWalletAPIBroadcastFail,
    },
    accountsParams: [{ id: "11" }, { id: "12" }],
  });

  const uiNavigation = jest.fn();

  beforeEach(() => {
    mockWalletAPIBroadcastFail.mockClear();
    uiNavigation.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
  });

  describe("when nominal case", () => {
    // Given
    const accountId = "js:2:ethereum:0x012:";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
    const signedTransaction = createSignedOperation();

    beforeEach(() => {
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);
    });

    it("calls uiNavigation callback with a signedOperation", async () => {
      // Given
      const expectedResult = "Function called";
      // const signedOperation = createSignedOperation();
      // jest
      //   .spyOn(serializers, "deserializeWalletAPISignedTransaction")
      //   .mockReturnValueOnce(signedOperation);
      uiNavigation.mockResolvedValueOnce(expectedResult);

      // When
      const result = await broadcastTransactionLogic(
        context,
        walletAccountId,
        signedTransaction,
        uiNavigation,
      );

      // Then
      expect(uiNavigation).toHaveBeenCalledTimes(1);
      // expect(uiNavigation.mock.calls[0][2]).toEqual(signedOperation);
      expect(result).toEqual(expectedResult);
    });

    it("calls the tracking for success", async () => {
      // When
      await broadcastTransactionLogic(context, walletAccountId, signedTransaction, uiNavigation);

      // Then
      expect(mockWalletAPIBroadcastFail).toHaveBeenCalledTimes(0);
    });
  });

  describe("when account cannot be found", () => {
    // Given
    const nonFoundAccountId = "js:2:ethereum:0x010:";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
    const signedTransaction = createSignedOperation();

    beforeEach(() => {
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(nonFoundAccountId);
    });

    it("returns an error", async () => {
      // Given
      const expectedResult = "Function called";
      // const signedOperation = createSignedOperation();
      // jest
      //   .spyOn(serializers, "deserializeWalletAPISignedTransaction")
      //   .mockReturnValueOnce(signedOperation);
      uiNavigation.mockResolvedValueOnce(expectedResult);

      // When
      await expect(async () => {
        await broadcastTransactionLogic(context, walletAccountId, signedTransaction, uiNavigation);
      }).rejects.toThrow("Account required");

      // Then
      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      // When
      await expect(async () => {
        await broadcastTransactionLogic(context, walletAccountId, signedTransaction, uiNavigation);
      }).rejects.toThrow();

      // Then
      expect(mockWalletAPIBroadcastFail).toHaveBeenCalledTimes(1);
    });
  });
});

describe("signMessageLogic", () => {
  // Given
  const mockWalletAPISignMessageRequested = jest.fn();
  const mockWalletAPISignMessageFail = jest.fn();

  const context = createContextContainingAccountId({
    tracking: {
      signMessageRequested: mockWalletAPISignMessageRequested,
      signMessageFail: mockWalletAPISignMessageFail,
    },
    accountsParams: [{ id: "11" }, { id: "12" }],
  });

  const uiNavigation = jest.fn();

  beforeEach(() => {
    mockWalletAPISignMessageRequested.mockClear();
    mockWalletAPISignMessageFail.mockClear();
    uiNavigation.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
  });

  describe("when nominal case", () => {
    // Given
    const accountId = "js:2:ethereum:0x012:";
    const messageToSign = "Message to sign";

    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      mockedPrepareMessageToSign.mockClear();
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);
    });

    it("calls uiNavigation callback with a signedOperation", async () => {
      // Given
      const expectedResult = "Function called";
      const formattedMessage = createMessageData();
      mockedPrepareMessageToSign.mockReturnValueOnce(formattedMessage);
      uiNavigation.mockResolvedValueOnce(expectedResult);

      // When
      const result = await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);

      // Then
      expect(uiNavigation).toHaveBeenCalledTimes(1);
      expect(uiNavigation.mock.calls[0][1]).toEqual(formattedMessage);
      expect(result).toEqual(expectedResult);
    });

    it("calls the tracking for success", async () => {
      // When
      await signMessageLogic(context, accountId, messageToSign, uiNavigation);

      // Then
      expect(mockWalletAPISignMessageRequested).toHaveBeenCalledTimes(1);
      expect(mockWalletAPISignMessageFail).toHaveBeenCalledTimes(0);
    });
  });

  describe("when account cannot be found", () => {
    // Given
    const nonFoundAccountId = "js:2:ethereum:0x010:";
    const messageToSign = "Message to sign";

    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(nonFoundAccountId);
    });

    it("returns an error", async () => {
      // When
      await expect(async () => {
        await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);
      }).rejects.toThrow("account not found");

      // Then
      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      // When
      await expect(async () => {
        await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);
      }).rejects.toThrow();

      // Then
      expect(mockWalletAPISignMessageRequested).toHaveBeenCalledTimes(1);
      expect(mockWalletAPISignMessageFail).toHaveBeenCalledTimes(1);
    });
  });

  describe("when account found is not of type 'Account'", () => {
    // Given
    const tokenAccountId = "15";
    const messageToSign = "Message to sign";
    context.accounts = [createTokenAccount(tokenAccountId), ...context.accounts];

    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(tokenAccountId);
    });

    it("returns an error", async () => {
      // When
      await expect(async () => {
        await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);
      }).rejects.toThrow("account provided should be the main one");

      // Then
      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      // When
      await expect(async () => {
        await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);
      }).rejects.toThrow();

      // Then
      expect(mockWalletAPISignMessageRequested).toHaveBeenCalledTimes(1);
      expect(mockWalletAPISignMessageFail).toHaveBeenCalledTimes(1);
    });
  });

  describe("when inner call prepareMessageToSign raise an error", () => {
    // Given
    const accountId = "js:2:ethereum:0x012:";
    const messageToSign = "Message to sign";

    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      mockedPrepareMessageToSign.mockClear();
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);
    });

    it("returns an error", async () => {
      // Given
      mockedPrepareMessageToSign.mockImplementationOnce(() => {
        throw new Error("Some error");
      });

      // When
      await expect(async () => {
        await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);
      }).rejects.toThrow("Some error");

      // Then
      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      // Given
      mockedPrepareMessageToSign.mockImplementationOnce(() => {
        throw new Error("Some error");
      });

      // When
      await expect(async () => {
        await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);
      }).rejects.toThrow();

      // Then
      expect(mockWalletAPISignMessageRequested).toHaveBeenCalledTimes(1);
      expect(mockWalletAPISignMessageFail).toHaveBeenCalledTimes(1);
    });
  });
});

jest.mock("@ledgerhq/coin-bitcoin/lib/wallet-btc/index", () => ({
  ...jest.requireActual("@ledgerhq/coin-bitcoin/lib/wallet-btc/index"),
  getWalletAccount: jest.fn().mockReturnValue({
    params: { path: "84'/0'", index: 0 },
    xpub: {
      derivationMode: "native_segwit",
      xpub: "xpub",
      crypto: {
        getAddress: jest
          .fn()
          .mockImplementation((_mode, _xpub, account, index) =>
            Promise.resolve(account === 0 && index === 1 ? "0x01" : `addr_${account}_${index}`),
          ),
        getPubkeyAt: jest.fn().mockReturnValue(Buffer.from("testPubkey")),
      },
      getXpubAddresses: jest.fn().mockResolvedValue([
        { account: 0, index: 0, address: "bc1qfirst" },
        { account: 0, index: 1, address: "bc1qsecond" },
        { account: 1, index: 0, address: "bc1qchange0" },
      ]),
      storage: {
        getAddressUnspentUtxos: jest.fn().mockReturnValue([]),
      },
    },
  }),
}));

describe("bitcoinFamilyAccountGetAddressLogic", () => {
  // Given
  const mockBitcoinFamilyAccountAddressRequested = jest.fn();
  const mockBitcoinFamilyAccountAddressFail = jest.fn();
  const mockBitcoinFamilyAccountAddressSuccess = jest.fn();

  const bitcoinCrypto = cryptocurrenciesById["bitcoin"];

  const context = createContextContainingAccountId({
    tracking: {
      bitcoinFamilyAccountAddressRequested: mockBitcoinFamilyAccountAddressRequested,
      bitcoinFamilyAccountAddressFail: mockBitcoinFamilyAccountAddressFail,
      bitcoinFamilyAccountAddressSuccess: mockBitcoinFamilyAccountAddressSuccess,
    },
    accountsParams: [{ id: "11" }, { id: "12" }, { id: "13", currency: bitcoinCrypto }],
  });

  beforeEach(() => {
    mockBitcoinFamilyAccountAddressRequested.mockClear();
    mockBitcoinFamilyAccountAddressFail.mockClear();
    mockBitcoinFamilyAccountAddressSuccess.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
  });

  const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

  it.each([
    {
      desc: "receive unkown accountId",
      accountId: undefined,
      errorMessage: `accountId ${walletAccountId} unknown`,
    },
    {
      desc: "account not found",
      accountId: "js:2:ethereum:0x010:",
      errorMessage: "account not found",
    },
    {
      desc: "account is not a bitcoin family account",
      accountId: "js:2:ethereum:0x012:",
      errorMessage: "not a bitcoin family account",
    },
  ])("returns an error when $desc", async ({ accountId, errorMessage }) => {
    // Given

    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    // When
    await expect(async () => {
      await bitcoinFamilyAccountGetAddressLogic(context, walletAccountId);
    }).rejects.toThrow(errorMessage);

    // Then
    expect(mockBitcoinFamilyAccountAddressRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressFail).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressSuccess).toHaveBeenCalledTimes(0);
  });

  it("should return the address", async () => {
    // Given
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    // When
    const result = await bitcoinFamilyAccountGetAddressLogic(context, walletAccountId);

    // Then
    expect(result).toEqual("0x01");
    expect(mockBitcoinFamilyAccountAddressRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressFail).toHaveBeenCalledTimes(0);
    expect(mockBitcoinFamilyAccountAddressSuccess).toHaveBeenCalledTimes(1);
  });

  it("should return the address with a derivationPath", async () => {
    // Given
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    // When
    const result = await bitcoinFamilyAccountGetAddressLogic(context, walletAccountId, "0/1");

    // Then
    expect(result).toEqual("0x01");
    expect(mockBitcoinFamilyAccountAddressRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressFail).toHaveBeenCalledTimes(0);
    expect(mockBitcoinFamilyAccountAddressSuccess).toHaveBeenCalledTimes(1);
  });
});

describe("bitcoinFamilyAccountGetPublicKeyLogic", () => {
  // Given
  const mockBitcoinFamilyAccountPublicKeyRequested = jest.fn();
  const mockBitcoinFamilyAccountPublicKeyFail = jest.fn();
  const mockBitcoinFamilyAccountPublicKeySuccess = jest.fn();

  const bitcoinCrypto = cryptocurrenciesById["bitcoin"];

  const context = createContextContainingAccountId({
    tracking: {
      bitcoinFamilyAccountPublicKeyRequested: mockBitcoinFamilyAccountPublicKeyRequested,
      bitcoinFamilyAccountPublicKeyFail: mockBitcoinFamilyAccountPublicKeyFail,
      bitcoinFamilyAccountPublicKeySuccess: mockBitcoinFamilyAccountPublicKeySuccess,
    },
    accountsParams: [{ id: "11" }, { id: "12" }, { id: "13", currency: bitcoinCrypto }],
  });

  beforeEach(() => {
    mockBitcoinFamilyAccountPublicKeyRequested.mockClear();
    mockBitcoinFamilyAccountPublicKeyFail.mockClear();
    mockBitcoinFamilyAccountPublicKeySuccess.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
  });

  const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

  it.each([
    {
      desc: "receive unkown accountId",
      accountId: undefined,
      errorMessage: `accountId ${walletAccountId} unknown`,
    },
    {
      desc: "account not found",
      accountId: "js:2:ethereum:0x010:",
      errorMessage: "account not found",
    },
    {
      desc: "account is not a bitcoin family account",
      accountId: "js:2:ethereum:0x012:",
      errorMessage: "not a bitcoin family account",
    },
  ])("returns an error when $desc", async ({ accountId, errorMessage }) => {
    // Given

    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    // When
    await expect(async () => {
      await bitcoinFamilyAccountGetPublicKeyLogic(context, walletAccountId);
    }).rejects.toThrow(errorMessage);

    // Then
    expect(mockBitcoinFamilyAccountPublicKeyRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountPublicKeyFail).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountPublicKeySuccess).toHaveBeenCalledTimes(0);
  });

  it("should return the PublicKey", async () => {
    // Given
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    // When
    const result = await bitcoinFamilyAccountGetPublicKeyLogic(context, walletAccountId);

    // Then
    expect(result).toEqual(Buffer.from("testPubkey").toString("hex"));
    expect(mockBitcoinFamilyAccountPublicKeyRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountPublicKeyFail).toHaveBeenCalledTimes(0);
    expect(mockBitcoinFamilyAccountPublicKeySuccess).toHaveBeenCalledTimes(1);
  });

  it("should return the PublicKey with a derivationPath", async () => {
    // Given
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    // When
    const result = await bitcoinFamilyAccountGetPublicKeyLogic(context, walletAccountId, "0/1");

    // Then
    expect(result).toEqual(Buffer.from("testPubkey").toString("hex"));
    expect(mockBitcoinFamilyAccountPublicKeyRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountPublicKeyFail).toHaveBeenCalledTimes(0);
    expect(mockBitcoinFamilyAccountPublicKeySuccess).toHaveBeenCalledTimes(1);
  });
});

describe("bitcoinFamilyAccountGetAddressesLogic", () => {
  const mockBitcoinFamilyAccountAddressesRequested = jest.fn();
  const mockBitcoinFamilyAccountAddressesFail = jest.fn();
  const mockBitcoinFamilyAccountAddressesSuccess = jest.fn();

  const bitcoinCrypto = cryptocurrenciesById["bitcoin"];

  const context = createContextContainingAccountId({
    tracking: {
      bitcoinFamilyAccountAddressesRequested: mockBitcoinFamilyAccountAddressesRequested,
      bitcoinFamilyAccountAddressesFail: mockBitcoinFamilyAccountAddressesFail,
      bitcoinFamilyAccountAddressesSuccess: mockBitcoinFamilyAccountAddressesSuccess,
    },
    accountsParams: [{ id: "11" }, { id: "12" }, { id: "13", currency: bitcoinCrypto }],
  });

  const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

  beforeEach(() => {
    mockBitcoinFamilyAccountAddressesRequested.mockClear();
    mockBitcoinFamilyAccountAddressesFail.mockClear();
    mockBitcoinFamilyAccountAddressesSuccess.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
  });

  it("returns empty array when intentions does not include payment", async () => {
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    const result = await bitcoinFamilyAccountGetAddressesLogic(context, walletAccountId, [
      "ordinal",
    ]);

    expect(result).toEqual([]);
    expect(mockBitcoinFamilyAccountAddressesRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressesSuccess).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressesFail).toHaveBeenCalledTimes(0);
  });

  it.each([
    {
      desc: "unknown accountId",
      accountId: undefined,
      errorMessage: `accountId ${walletAccountId} unknown`,
    },
    {
      desc: "account not found",
      accountId: "js:2:ethereum:0x010:",
      errorMessage: "account not found",
    },
    {
      desc: "account is not a bitcoin family account",
      accountId: "js:2:ethereum:0x012:",
      errorMessage: "account requested is not a bitcoin family account",
    },
  ])("rejects when $desc", async ({ accountId, errorMessage }) => {
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    await expect(bitcoinFamilyAccountGetAddressesLogic(context, walletAccountId)).rejects.toThrow(
      errorMessage,
    );

    expect(mockBitcoinFamilyAccountAddressesRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressesFail).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressesSuccess).toHaveBeenCalledTimes(0);
  });

  it("returns addresses with first external address and unused receive and change addresses", async () => {
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    const result = await bitcoinFamilyAccountGetAddressesLogic(context, walletAccountId);

    expect(mockBitcoinFamilyAccountAddressesRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressesFail).toHaveBeenCalledTimes(0);
    expect(mockBitcoinFamilyAccountAddressesSuccess).toHaveBeenCalledTimes(1);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const firstExternal = result.find((r: { path?: string }) => r.path === "m/84'/0'/0'/0/0");
    expect(firstExternal).toBeDefined();
    expect(firstExternal?.address).toBeDefined();
    expect(firstExternal?.publicKey).toBe(Buffer.from("testPubkey").toString("hex"));
    expect(firstExternal?.intention).toBe("payment");

    result.forEach(
      (item: { address: string; publicKey?: string; path?: string; intention?: string }) => {
        expect(item).toHaveProperty("address");
        expect(item).toHaveProperty("publicKey");
        expect(item).toHaveProperty("path");
        expect(item.intention).toBe("payment");
      },
    );
  });

  it("includes at least 2 unused receive and 2 unused change addresses", async () => {
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    const result = await bitcoinFamilyAccountGetAddressesLogic(context, walletAccountId);

    const receiveAddresses = result.filter((r: { path?: string }) =>
      /\/0\/\d+$/.test(r.path ?? ""),
    );
    const changeAddresses = result.filter((r: { path?: string }) => /\/1\/\d+$/.test(r.path ?? ""));

    expect(receiveAddresses.length).toBeGreaterThanOrEqual(2);
    expect(changeAddresses.length).toBeGreaterThanOrEqual(2);
  });

  it("includes addresses that have UTXOs", async () => {
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    const mockGetAddressUnspentUtxos = jest.fn().mockImplementation((addr: { address: string }) => {
      // bc1qsecond (account 0, index 1) has a UTXO
      if (addr.address === "bc1qsecond") return [{ value: "1000" }];
      return [];
    });

    mockedGetWalletAccount.mockReturnValueOnce({
      params: { path: "84'/0'", index: 0 },
      xpub: {
        derivationMode: "native_segwit",
        xpub: "xpub",
        crypto: {
          getAddress: jest
            .fn()
            .mockImplementation((_mode: string, _xpub: string, account: number, index: number) =>
              Promise.resolve(`addr_${account}_${index}`),
            ),
          getPubkeyAt: jest.fn().mockReturnValue(Buffer.from("testPubkey")),
        },
        getXpubAddresses: jest.fn().mockResolvedValue([
          { account: 0, index: 0, address: "bc1qfirst" },
          { account: 0, index: 1, address: "bc1qsecond" },
          { account: 1, index: 0, address: "bc1qchange0" },
        ]),
        storage: {
          getAddressUnspentUtxos: mockGetAddressUnspentUtxos,
        },
      },
    });

    const result = await bitcoinFamilyAccountGetAddressesLogic(context, walletAccountId);

    // Address at index 1 (which has a UTXO) should be included
    const addrWithUtxo = result.find((r: { path?: string }) => r.path === "m/84'/0'/0'/0/1");
    expect(addrWithUtxo).toBeDefined();
    expect(addrWithUtxo?.address).toBe("bc1qsecond");

    // getAddressUnspentUtxos should have been called for each known address
    expect(mockGetAddressUnspentUtxos).toHaveBeenCalledTimes(3);

    expect(mockBitcoinFamilyAccountAddressesRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountAddressesFail).toHaveBeenCalledTimes(0);
    expect(mockBitcoinFamilyAccountAddressesSuccess).toHaveBeenCalledTimes(1);
  });
});

describe("bitcoinFamilyAccountGetXPubLogic", () => {
  // Given
  const mockBitcoinFamilyAccountXpubRequested = jest.fn();
  const mockBitcoinFamilyAccountXpubFail = jest.fn();
  const mockBitcoinFamilyAccountXpubSuccess = jest.fn();

  const bitcoinCrypto = cryptocurrenciesById["bitcoin"];

  const context = createContextContainingAccountId({
    tracking: {
      bitcoinFamilyAccountXpubRequested: mockBitcoinFamilyAccountXpubRequested,
      bitcoinFamilyAccountXpubFail: mockBitcoinFamilyAccountXpubFail,
      bitcoinFamilyAccountXpubSuccess: mockBitcoinFamilyAccountXpubSuccess,
    },
    accountsParams: [{ id: "11" }, { id: "12" }, { id: "13", currency: bitcoinCrypto }],
  });

  beforeEach(() => {
    mockBitcoinFamilyAccountXpubRequested.mockClear();
    mockBitcoinFamilyAccountXpubFail.mockClear();
    mockBitcoinFamilyAccountXpubSuccess.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
  });

  const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

  it.each([
    {
      desc: "receive unkown accountId",
      accountId: undefined,
      errorMessage: `accountId ${walletAccountId} unknown`,
    },
    {
      desc: "account not found",
      accountId: "js:2:ethereum:0x010:",
      errorMessage: "account not found",
    },
    {
      desc: "account is not a bitcoin family account",
      accountId: "js:2:ethereum:0x012:",
      errorMessage: "not a bitcoin family account",
    },
  ])("returns an error when $desc", async ({ accountId, errorMessage }) => {
    // Given

    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    // When
    await expect(async () => {
      await bitcoinFamilyAccountGetXPubLogic(context, walletAccountId);
    }).rejects.toThrow(errorMessage);

    // Then
    expect(mockBitcoinFamilyAccountXpubRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountXpubFail).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountXpubSuccess).toHaveBeenCalledTimes(0);
  });

  it("should return the xpub", async () => {
    // Given
    const accountId = "js:2:bitcoin:0x013:";
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);

    // When
    const result = await bitcoinFamilyAccountGetXPubLogic(context, walletAccountId);

    // Then
    expect(result).toEqual("testxpub");
    expect(mockBitcoinFamilyAccountXpubRequested).toHaveBeenCalledTimes(1);
    expect(mockBitcoinFamilyAccountXpubFail).toHaveBeenCalledTimes(0);
    expect(mockBitcoinFamilyAccountXpubSuccess).toHaveBeenCalledTimes(1);
  });
});

function createAppManifest(id = "1"): AppManifest {
  return {
    id,
    private: false,
    name: "New App Manifest",
    url: "https://www.ledger.com",
    homepageUrl: "https://www.ledger.com",
    supportUrl: "https://www.ledger.com",
    icon: null,
    platforms: ["ios", "android", "desktop"],
    apiVersion: "1.0.0",
    manifestVersion: "1.0.0",
    branch: "debug",
    params: undefined,
    categories: [],
    currencies: "*",
    content: {
      shortDescription: {
        en: "short description",
      },
      description: {
        en: "description",
      },
    },
    permissions: [],
    domains: [],
    visibility: "complete",
  };
}

function createContextContainingAccountId({
  tracking,
  accountsParams,
}: {
  tracking: Partial<TrackingAPI>;
  accountsParams: Array<{ id: string; currency?: CryptoCurrency }>;
}): WalletAPIContext {
  return {
    manifest: createAppManifest(),
    accounts: accountsParams
      .map(({ id, currency }) => createFixtureAccount(id, currency))
      .concat([createFixtureAccount()]),
    tracking: tracking as TrackingAPI,
  };
}

function createSignedOperation(): SignedOperation {
  const operation = {
    id: "42",
    hash: "hashed",
    type: "IN" as OperationType,
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: "14",
    date: new Date(),
    extra: {},
  };
  return {
    operation,
    signature: "Signature",
  };
}

function createWalletAPIAccount() {
  return {
    id: "12",
    name: "",
    address: "",
    currency: "",
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    blockHeight: 0,
    lastSyncDate: new Date(),
  };
}

function createMessageData() {
  return {
    account: createFixtureAccount("17"),
    message: "default message",
  };
}

function createTokenAccount(id = "32"): TokenAccount {
  return {
    type: "TokenAccount",
    id,
    parentId: "whatever",
    token: createTokenCurrency(),
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      WEEK: { latestDate: null, balances: [] },
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
    },
    swapHistory: [],
  };
}

function createTokenCurrency(): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: "3",
    contractAddress: "",
    parentCurrency: createFixtureCryptoCurrency("eth"),
    tokenType: "",
    //-- CurrencyCommon
    name: "",
    ticker: "",
    units: [],
  };
}
