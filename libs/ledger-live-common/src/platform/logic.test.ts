import { broadcastTransactionLogic, receiveOnAccountLogic } from "./logic";

import { AppManifest } from "./types";
import { createAccount } from "../mock/fixtures/cryptoCurrencies";
import {
  OperationType,
  SignedOperation,
  SignedOperationRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

import * as converters from "./converters";
import * as serializers from "./serializers";

// Given
const mockPlatformReceiveRequested = jest.fn();
const mockPlatformReceiveFail = jest.fn();
const context = createContextContainingAccountId(
  mockPlatformReceiveRequested,
  mockPlatformReceiveFail,
  "11",
  "12"
);

describe("receiveOnAccountLogic", () => {
  const uiNavigation = jest.fn();

  beforeEach(() => uiNavigation.mockClear());

  describe("when nominal case", () => {
    // Given
    const accountId = "12";
    const expectedResult = "Function called";

    beforeEach(() => {
      mockPlatformReceiveRequested.mockClear();
      mockPlatformReceiveFail.mockClear();
      uiNavigation.mockResolvedValueOnce(expectedResult);
    });

    it("calls uiNavigation callback with an accountAddress", async () => {
      // Given
      const convertedAccount = {
        ...createPlatformAccount(),
        address: "Converted address",
      };
      jest
        .spyOn(converters, "accountToPlatformAccount")
        .mockReturnValueOnce(convertedAccount);

      // When
      const result = await receiveOnAccountLogic(
        context,
        accountId,
        uiNavigation
      );

      // Then
      expect(uiNavigation).toBeCalledTimes(1);
      expect(uiNavigation.mock.calls[0][2]).toEqual("Converted address");
      expect(result).toEqual(expectedResult);
    });

    it("calls the tracking for success", async () => {
      // When
      await receiveOnAccountLogic(context, accountId, uiNavigation);

      // Then
      expect(mockPlatformReceiveRequested).toBeCalledTimes(1);
      expect(mockPlatformReceiveFail).toBeCalledTimes(0);
    });
  });

  describe("when account cannot be found", () => {
    // Given
    const accountId = "10";

    beforeEach(() => {
      mockPlatformReceiveRequested.mockClear();
      mockPlatformReceiveFail.mockClear();
    });

    it("returns an error", async () => {
      // When
      await expect(async () => {
        await receiveOnAccountLogic(context, accountId, uiNavigation);
      }).rejects.toThrowError("Account required");

      // Then
      expect(uiNavigation).toBeCalledTimes(0);
    });

    it("calls the tracking", async () => {
      // When
      await expect(async () => {
        await receiveOnAccountLogic(context, accountId, uiNavigation);
      }).rejects.toThrowError("Account required");

      // Then
      expect(mockPlatformReceiveRequested).toBeCalledTimes(1);
      expect(mockPlatformReceiveFail).toBeCalledTimes(1);
    });
  });
});

describe("broadcastTransactionLogic", () => {
  it("calls uiNavigation callback with a signedOperation", async () => {
    // Given
    const accountId = "12";
    const rawSignedTransaction = createSignedOperationRaw();
    const expectedResult = "Function called";
    const signedOperation = createSignedOperation();
    jest
      .spyOn(serializers, "deserializePlatformSignedTransaction")
      .mockReturnValueOnce(signedOperation);
    const uiNavigation = jest.fn().mockResolvedValueOnce(expectedResult);

    // When
    const result = await broadcastTransactionLogic(
      context,
      accountId,
      rawSignedTransaction,
      uiNavigation
    );

    // Then
    expect(uiNavigation).toBeCalledTimes(1);
    expect(uiNavigation.mock.calls[0][2]).toEqual(signedOperation);
    expect(result).toEqual(expectedResult);
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

function createContextContainingAccountId(
  platformReceiveRequested: jest.Mock,
  platformReceiveFail: jest.Mock,
  ...accountIds: string[]
) {
  return {
    manifest: createAppManifest(),
    accounts: [...accountIds.map((val) => createAccount(val)), createAccount()],
    tracking: {
      platformReceiveRequested,
      platformReceiveFail,
    },
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

function createSignedOperationRaw(): SignedOperationRaw {
  const rawOperation = {
    id: "12",
    hash: "123456",
    type: "CREATE" as OperationType,
    value: "0",
    fee: "0",
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: "12",
    date: "01/01/1970",
    extra: {},
  };
  return {
    operation: rawOperation,
    signature: "Signature",
    expirationDate: null,
  };
}

function createPlatformAccount() {
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
