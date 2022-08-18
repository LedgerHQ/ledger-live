import { broadcastTransactionLogic, receiveOnAccountLogic } from "./logic";

import { AppManifest } from "./types";
import { createAccount } from "../mock/fixtures/cryptoCurrencies";
import { OperationType, SignedOperation, SignedOperationRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

describe("receiveOnAccountLogic", () => {
  it("calls uiNavigation callback with an accountAddress", async () => {
    // Given
    const accountId = "12";
    const context = createContextContainingAccountId(accountId);
    const expectedResult = "Function called";
    const uiNavigation = jest.fn().mockResolvedValueOnce(expectedResult);

    // When
    const result = await receiveOnAccountLogic(
      context,
      accountId,
      uiNavigation
    );

    // Then
    expect(uiNavigation).toBeCalledTimes(1);
    expect(uiNavigation.mock.calls[0][2]).toBeTruthy();
    expect(result).toEqual(expectedResult);
    expect(context.tracking.platformReceiveRequested).toBeCalledTimes(1);
    expect(context.tracking.platformReceiveFail).toBeCalledTimes(0);
  });

  it("returns an error when account cannot be found", async () => {
    // Given
    const accountId = "12";
    const context = createContextContainingAccountId("10", "11");
    const uiNavigation = jest.fn().mockResolvedValueOnce("Function called");

    // When
    await expect(async () => {
      await receiveOnAccountLogic(context, accountId, uiNavigation);
    }).rejects.toThrowError("Account required");

    // Then
    expect(uiNavigation).toBeCalledTimes(0);
    expect(context.tracking.platformReceiveRequested).toBeCalledTimes(1);
    expect(context.tracking.platformReceiveFail).toBeCalledTimes(1);
  });
});

const signedOperation = createSignedOperation()
jest.mock("./serializers", () => {
  return {
    deserializePlatformSignedTransaction: jest.fn(() => signedOperation),
  };
});

describe("broadcastTransactionLogic", () => {
  it("calls uiNavigation callback with a signedOperation", async () => {
    // Given
    const accountId = "12";
    const context = createContextContainingAccountId(accountId);
    const rawSignedTransaction = createSignedOperationRaw();
    const expectedResult = "Function called";
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

function createContextContainingAccountId(...accountIds: string[]) {
  return {
    manifest: createAppManifest(),
    accounts: [...accountIds.map((val) => createAccount(val)), createAccount()],
    tracking: {
      platformReceiveRequested: jest.fn(),
      platformReceiveFail: jest.fn(),
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
