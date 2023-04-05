import {
  bitcoinFamillyAccountGetXPubLogic,
  broadcastTransactionLogic,
  receiveOnAccountLogic,
  signMessageLogic,
  WalletAPIContext,
} from "./logic";

import { AppManifest } from "./types";
import {
  createFixtureAccount,
  createFixtureCryptoCurrency,
} from "../mock/fixtures/cryptoCurrencies";
import {
  OperationType,
  SignedOperation,
  TokenAccount,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

import * as converters from "./converters";
import * as signMessage from "../hw/signMessage/index";
import { DerivationMode } from "@ledgerhq/coin-framework/derivation";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { TrackingAPI } from "./tracking";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";

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
  const getAccountIdFromWalletAccountIdSpy = jest.spyOn(
    converters,
    "getAccountIdFromWalletAccountId"
  );

  beforeEach(() => {
    mockWalletAPIReceiveRequested.mockClear();
    mockWalletAPIReceiveFail.mockClear();
    uiNavigation.mockClear();
    getAccountIdFromWalletAccountIdSpy.mockClear();
  });

  describe("when nominal case", () => {
    // Given
    const accountId = "ethereumjs:2:ethereum:0x012:";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
    const expectedResult = "Function called";

    beforeEach(() => {
      uiNavigation.mockResolvedValueOnce(expectedResult);
      getAccountIdFromWalletAccountIdSpy.mockReturnValueOnce(accountId);
    });

    it("calls uiNavigation callback with an accountAddress", async () => {
      // Given
      const convertedAccount = {
        ...createWalletAPIAccount(),
        address: "Converted address",
      };
      jest
        .spyOn(converters, "accountToWalletAPIAccount")
        .mockReturnValueOnce(convertedAccount);

      // When
      const result = await receiveOnAccountLogic(
        context,
        walletAccountId,
        uiNavigation
      );

      // Then
      expect(uiNavigation).toBeCalledTimes(1);
      expect(uiNavigation.mock.calls[0][2]).toEqual("Converted address");
      expect(result).toEqual(expectedResult);
    });

    it("calls the tracking for success", async () => {
      // When
      await receiveOnAccountLogic(context, walletAccountId, uiNavigation);

      // Then
      expect(mockWalletAPIReceiveRequested).toBeCalledTimes(1);
      expect(mockWalletAPIReceiveFail).toBeCalledTimes(0);
    });
  });

  describe("when account cannot be found", () => {
    // Given
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      getAccountIdFromWalletAccountIdSpy.mockReturnValueOnce(undefined);
    });

    it("returns an error", async () => {
      // When
      await expect(async () => {
        await receiveOnAccountLogic(context, walletAccountId, uiNavigation);
      }).rejects.toThrowError(`accountId ${walletAccountId} unknown`);

      // Then
      expect(uiNavigation).toBeCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      // When
      await expect(async () => {
        await receiveOnAccountLogic(context, walletAccountId, uiNavigation);
      }).rejects.toThrow();

      // Then
      expect(mockWalletAPIReceiveRequested).toBeCalledTimes(1);
      expect(mockWalletAPIReceiveFail).toBeCalledTimes(1);
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

  const getAccountIdFromWalletAccountIdSpy = jest.spyOn(
    converters,
    "getAccountIdFromWalletAccountId"
  );

  beforeEach(() => {
    mockWalletAPIBroadcastFail.mockClear();
    uiNavigation.mockClear();
    getAccountIdFromWalletAccountIdSpy.mockClear();
  });

  describe("when nominal case", () => {
    // Given
    const accountId = "ethereumjs:2:ethereum:0x012:";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
    const signedTransaction = createSignedOperation();

    beforeEach(() => {
      getAccountIdFromWalletAccountIdSpy.mockReturnValueOnce(accountId);
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
        uiNavigation
      );

      // Then
      expect(uiNavigation).toBeCalledTimes(1);
      // expect(uiNavigation.mock.calls[0][2]).toEqual(signedOperation);
      expect(result).toEqual(expectedResult);
    });

    it("calls the tracking for success", async () => {
      // When
      await broadcastTransactionLogic(
        context,
        walletAccountId,
        signedTransaction,
        uiNavigation
      );

      // Then
      expect(mockWalletAPIBroadcastFail).toBeCalledTimes(0);
    });
  });

  describe("when account cannot be found", () => {
    // Given
    const nonFoundAccountId = "ethereumjs:2:ethereum:0x010:";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
    const signedTransaction = createSignedOperation();

    beforeEach(() => {
      getAccountIdFromWalletAccountIdSpy.mockReturnValueOnce(nonFoundAccountId);
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
        await broadcastTransactionLogic(
          context,
          walletAccountId,
          signedTransaction,
          uiNavigation
        );
      }).rejects.toThrowError("Account required");

      // Then
      expect(uiNavigation).toBeCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      // When
      await expect(async () => {
        await broadcastTransactionLogic(
          context,
          walletAccountId,
          signedTransaction,
          uiNavigation
        );
      }).rejects.toThrow();

      // Then
      expect(mockWalletAPIBroadcastFail).toBeCalledTimes(1);
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

  const getAccountIdFromWalletAccountIdSpy = jest.spyOn(
    converters,
    "getAccountIdFromWalletAccountId"
  );

  beforeEach(() => {
    mockWalletAPISignMessageRequested.mockClear();
    mockWalletAPISignMessageFail.mockClear();
    uiNavigation.mockClear();
    getAccountIdFromWalletAccountIdSpy.mockClear();
  });

  describe("when nominal case", () => {
    // Given
    const accountId = "ethereumjs:2:ethereum:0x012:";
    const messageToSign = "Message to sign";
    const spyPrepareMessageToSign = jest.spyOn(
      signMessage,
      "prepareMessageToSign"
    );

    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      spyPrepareMessageToSign.mockClear();
      getAccountIdFromWalletAccountIdSpy.mockReturnValueOnce(accountId);
    });

    it("calls uiNavigation callback with a signedOperation", async () => {
      // Given
      const expectedResult = "Function called";
      const formattedMessage = createMessageData();
      spyPrepareMessageToSign.mockReturnValueOnce(formattedMessage);
      uiNavigation.mockResolvedValueOnce(expectedResult);

      // When
      const result = await signMessageLogic(
        context,
        walletAccountId,
        messageToSign,
        uiNavigation
      );

      // Then
      expect(uiNavigation).toBeCalledTimes(1);
      expect(uiNavigation.mock.calls[0][1]).toEqual(formattedMessage);
      expect(result).toEqual(expectedResult);
    });

    it("calls the tracking for success", async () => {
      // When
      await signMessageLogic(context, accountId, messageToSign, uiNavigation);

      // Then
      expect(mockWalletAPISignMessageRequested).toBeCalledTimes(1);
      expect(mockWalletAPISignMessageFail).toBeCalledTimes(0);
    });
  });

  describe("when account cannot be found", () => {
    // Given
    const nonFoundAccountId = "ethereumjs:2:ethereum:0x010:";
    const messageToSign = "Message to sign";

    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      getAccountIdFromWalletAccountIdSpy.mockReturnValueOnce(nonFoundAccountId);
    });

    it("returns an error", async () => {
      // When
      await expect(async () => {
        await signMessageLogic(
          context,
          walletAccountId,
          messageToSign,
          uiNavigation
        );
      }).rejects.toThrowError("account not found");

      // Then
      expect(uiNavigation).toBeCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      // When
      await expect(async () => {
        await signMessageLogic(
          context,
          walletAccountId,
          messageToSign,
          uiNavigation
        );
      }).rejects.toThrow();

      // Then
      expect(mockWalletAPISignMessageRequested).toBeCalledTimes(1);
      expect(mockWalletAPISignMessageFail).toBeCalledTimes(1);
    });
  });

  describe("when account found is not of type 'Account'", () => {
    // Given
    const tokenAccountId = "15";
    const messageToSign = "Message to sign";
    context.accounts = [
      createTokenAccount(tokenAccountId),
      ...context.accounts,
    ];

    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      getAccountIdFromWalletAccountIdSpy.mockReturnValueOnce(tokenAccountId);
    });

    it("returns an error", async () => {
      // When
      await expect(async () => {
        await signMessageLogic(
          context,
          walletAccountId,
          messageToSign,
          uiNavigation
        );
      }).rejects.toThrowError("account provided should be the main one");

      // Then
      expect(uiNavigation).toBeCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      // When
      await expect(async () => {
        await signMessageLogic(
          context,
          walletAccountId,
          messageToSign,
          uiNavigation
        );
      }).rejects.toThrow();

      // Then
      expect(mockWalletAPISignMessageRequested).toBeCalledTimes(1);
      expect(mockWalletAPISignMessageFail).toBeCalledTimes(1);
    });
  });

  describe("when inner call prepareMessageToSign raise an error", () => {
    // Given
    const accountId = "ethereumjs:2:ethereum:0x012:";
    const messageToSign = "Message to sign";
    const spyPrepareMessageToSign = jest.spyOn(
      signMessage,
      "prepareMessageToSign"
    );

    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      spyPrepareMessageToSign.mockClear();
      getAccountIdFromWalletAccountIdSpy.mockReturnValueOnce(accountId);
    });

    it("returns an error", async () => {
      // Given
      spyPrepareMessageToSign.mockImplementationOnce(() => {
        throw new Error("Some error");
      });

      // When
      await expect(async () => {
        await signMessageLogic(
          context,
          walletAccountId,
          messageToSign,
          uiNavigation
        );
      }).rejects.toThrowError("Some error");

      // Then
      expect(uiNavigation).toBeCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      // Given
      spyPrepareMessageToSign.mockImplementationOnce(() => {
        throw new Error("Some error");
      });

      // When
      await expect(async () => {
        await signMessageLogic(
          context,
          walletAccountId,
          messageToSign,
          uiNavigation
        );
      }).rejects.toThrow();

      // Then
      expect(mockWalletAPISignMessageRequested).toBeCalledTimes(1);
      expect(mockWalletAPISignMessageFail).toBeCalledTimes(1);
    });
  });
});

describe("bitcoinFamillyAccountGetXPubLogic", () => {
  // Given
  const mockBitcoinFamillyAccountXpubRequested = jest.fn();
  const mockBitcoinFamillyAccountXpubFail = jest.fn();
  const mockBitcoinFamillyAccountXpubSuccess = jest.fn();

  const bitcoinCrypto = cryptocurrenciesById["bitcoin"];

  const context = createContextContainingAccountId({
    tracking: {
      bitcoinFamillyAccountXpubRequested:
        mockBitcoinFamillyAccountXpubRequested,
      bitcoinFamillyAccountXpubFail: mockBitcoinFamillyAccountXpubFail,
      bitcoinFamillyAccountXpubSuccess: mockBitcoinFamillyAccountXpubSuccess,
    },
    accountsParams: [
      { id: "11" },
      { id: "12" },
      { id: "13", currency: bitcoinCrypto },
    ],
  });

  const getAccountIdFromWalletAccountIdSpy = jest.spyOn(
    converters,
    "getAccountIdFromWalletAccountId"
  );

  beforeEach(() => {
    mockBitcoinFamillyAccountXpubRequested.mockClear();
    mockBitcoinFamillyAccountXpubFail.mockClear();
    mockBitcoinFamillyAccountXpubSuccess.mockClear();
    getAccountIdFromWalletAccountIdSpy.mockClear();
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
      accountId: "ethereumjs:2:ethereum:0x010:",
      errorMessage: "account not found",
    },
    {
      desc: "account is not a bitcoin family account",
      accountId: "ethereumjs:2:ethereum:0x012:",
      errorMessage: "not a bitcoin family account",
    },
  ])("returns an error when $desc", async ({ accountId, errorMessage }) => {
    // Given

    getAccountIdFromWalletAccountIdSpy.mockReturnValueOnce(accountId);

    // When
    await expect(async () => {
      await bitcoinFamillyAccountGetXPubLogic(context, walletAccountId);
    }).rejects.toThrowError(errorMessage);

    // Then
    expect(mockBitcoinFamillyAccountXpubRequested).toBeCalledTimes(1);
    expect(mockBitcoinFamillyAccountXpubFail).toBeCalledTimes(1);
    expect(mockBitcoinFamillyAccountXpubSuccess).toBeCalledTimes(0);
  });

  it("should return the xpub", async () => {
    // Given
    const accountId = "bitcoinjs:2:bitcoin:0x013:";
    getAccountIdFromWalletAccountIdSpy.mockReturnValueOnce(accountId);

    // When
    const result = await bitcoinFamillyAccountGetXPubLogic(
      context,
      walletAccountId
    );

    // Then
    expect(result).toEqual("testxpub");
    expect(mockBitcoinFamillyAccountXpubRequested).toBeCalledTimes(1);
    expect(mockBitcoinFamillyAccountXpubFail).toBeCalledTimes(0);
    expect(mockBitcoinFamillyAccountXpubSuccess).toBeCalledTimes(1);
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
    platform: "all",
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
    expirationDate: null,
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
    currency: createFixtureCryptoCurrency("eth"),
    path: "path",
    derivationMode: "ethM" as DerivationMode,
    message: "default message",
    rawMessage: "raw default message",
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
    starred: false,
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
