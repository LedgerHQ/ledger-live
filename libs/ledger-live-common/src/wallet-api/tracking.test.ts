import trackingWrapper from "./tracking";
import { AppManifest } from "./types";

describe("trackingWrapper", () => {
  test.each([
    {
      method: "load",
      message: "WalletAPI Load",
    },
    {
      method: "reload",
      message: "WalletAPI Reload",
    },
    {
      method: "loadFail",
      message: "WalletAPI Load Fail",
    },
    {
      method: "loadSuccess",
      message: "WalletAPI Load Success",
    },
    {
      method: "signTransactionRequested",
      message: "WalletAPI SignTransaction",
    },
    {
      method: "signTransactionFail",
      message: "WalletAPI SignTransaction Fail",
    },
    {
      method: "signTransactionSuccess",
      message: "WalletAPI SignTransaction Success",
    },
    {
      method: "requestAccountRequested",
      message: "WalletAPI RequestAccount",
    },
    {
      method: "requestAccountFail",
      message: "WalletAPI RequestAccount Fail",
    },
    {
      method: "requestAccountSuccess",
      message: "WalletAPI RequestAccount Success",
    },
    {
      method: "receiveRequested",
      message: "WalletAPI Receive",
    },
    {
      method: "receiveFail",
      message: "WalletAPI Receive Fail",
    },
    {
      method: "receiveSuccess",
      message: "WalletAPI Receive Success",
    },
    {
      method: "broadcastFail",
      message: "WalletAPI Broadcast Fail",
    },
    {
      method: "broadcastSuccess",
      message: "WalletAPI Broadcast Success",
    },
    {
      method: "broadcastOperationDetailsClick",
      message: "WalletAPI Broadcast OpD Clicked",
    },
    {
      method: "startExchangeRequested",
      message: "WalletAPI start Exchange Nonce request",
    },
    {
      method: "startExchangeSuccess",
      message: "WalletAPI start Exchange Nonce success",
    },
    {
      method: "startExchangeFail",
      message: "WalletAPI start Exchange Nonce fail",
    },
    {
      method: "completeExchangeRequested",
      message: "WalletAPI complete Exchange requested",
    },
    {
      method: "completeExchangeSuccess",
      message: "WalletAPI complete Exchange success",
    },
    {
      method: "completeExchangeFail",
      message: "WalletAPI complete Exchange Nonce fail",
    },
    {
      method: "signMessageRequested",
      message: "WalletAPI sign message requested",
    },
    {
      method: "signMessageSuccess",
      message: "WalletAPI sign message success",
    },
    {
      method: "signMessageFail",
      message: "WalletAPI sign message fail",
    },
    {
      method: "signMessageUserRefused",
      message: "WalletAPI sign message user refused",
    },
  ])(
    "calls once inner trackWalletAPI function $method with event named: $message",
    ({ method, message }) => {
      // Given
      const appManifest = appManifestFixture();
      const mockedTrack = jest.fn();

      // When
      trackingWrapper(mockedTrack)[method](appManifest);

      // Then
      expect(mockedTrack).toHaveBeenCalledTimes(1);
      expect(mockedTrack).toHaveBeenCalledWith(
        message,
        {
          walletAPI: appManifest.name,
        },
        null
      );
    }
  );
});

function appManifestFixture(name = "live-app"): AppManifest {
  return {
    id: "12",
    name,
    url: "https://www.ledger.fr",
    homepageUrl: "https://www.ledger.fr",
    platforms: ["ios", "android", "desktop"],
    apiVersion: "1.0.0",
    manifestVersion: "1.0.0",
    branch: "debug",
    categories: ["test"],
    currencies: "*",
    content: {
      shortDescription: {
        en: "test",
      },
      description: {
        en: "test",
      },
    },
    permissions: [],
    domains: [],
  };
}
