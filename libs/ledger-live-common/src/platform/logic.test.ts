import { receiveOnAccountLogic } from "./logic";

import { createAccount } from "../__tests__/accounts/fixtures/index";
import { AppManifest } from "./types";

describe("receiveOnAccountLogic", () => {
  it("calls uiNavigation callback with an accountAddress", async () => {
    // Given
    const accountId = "12";
    const context = {
      manifest: createAppManifest(),
      accounts: [createAccount(accountId), createAccount()],
      tracking: {
        platformReceiveRequested: jest.fn(),
        platformReceiveFail: jest.fn(),
      },
    };
    const expectedResult = "Function called";
    const uiNavigation = jest.fn((_acc, _pAcc, _add) =>
      Promise.resolve(expectedResult)
    );

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
    const context = {
      manifest: createAppManifest(),
      accounts: [createAccount("10"), createAccount("11")],
      tracking: {
        platformReceiveRequested: jest.fn(),
        platformReceiveFail: jest.fn(),
      },
    };
    const uiNavigation = jest.fn(() => Promise.resolve("Function called"));

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
