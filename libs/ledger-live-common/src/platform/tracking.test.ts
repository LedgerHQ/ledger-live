import trackingWrapper from "./tracking";
import { LiveAppManifest } from "./types";

describe("trackingWrapper", () => {
  test.each([
    {
      method: "platformLoad",
      message: "Platform Load",
    },
    {
      method: "platformReload",
      message: "Platform Reload",
    },
    {
      method: "platformLoadFail",
      message: "Platform Load Fail",
    },
    {
      method: "platformLoadSuccess",
      message: "Platform Load Success",
    },
    {
      method: "platformSignTransactionRequested",
      message: "Platform SignTransaction",
    },
    {
      method: "platformSignTransactionFail",
      message: "Platform SignTransaction Fail",
    },
    {
      method: "platformSignTransactionSuccess",
      message: "Platform SignTransaction Success",
    },
    {
      method: "platformRequestAccountRequested",
      message: "Platform RequestAccount",
    },
    {
      method: "platformRequestAccountFail",
      message: "Platform RequestAccount Fail",
    },
    {
      method: "platformRequestAccountSuccess",
      message: "Platform RequestAccount Success",
    },
    {
      method: "platformReceiveRequested",
      message: "Platform Receive",
    },
    {
      method: "platformReceiveFail",
      message: "Platform Receive Fail",
    },
    {
      method: "platformReceiveSuccess",
      message: "Platform Receive Success",
    },
    {
      method: "platformBroadcastFail",
      message: "Platform Broadcast Fail",
    },
    {
      method: "platformBroadcastSuccess",
      message: "Platform Broadcast Success",
    },
    {
      method: "platformBroadcastOperationDetailsClick",
      message: "Platform Broadcast OpD Clicked",
    },
    {
      method: "platformStartExchangeRequested",
      message: "Platform start Exchange Nonce request",
    },
    {
      method: "platformStartExchangeSuccess",
      message: "Platform start Exchange Nonce success",
    },
    {
      method: "platformStartExchangeFail",
      message: "Platform start Exchange Nonce fail",
    },
    {
      method: "platformCompleteExchangeRequested",
      message: "Platform complete Exchange requested",
    },
    {
      method: "platformCompleteExchangeSuccess",
      message: "Platform complete Exchange success",
    },
    {
      method: "platformCompleteExchangeFail",
      message: "Platform complete Exchange Nonce fail",
    },
    {
      method: "platformSignMessageRequested",
      message: "Platform sign message requested",
    },
    {
      method: "platformSignMessageSuccess",
      message: "Platform sign message success",
    },
    {
      method: "platformSignMessageFail",
      message: "Platform sign message fail",
    },
    {
      method: "platformSignMessageUserRefused",
      message: "Platform sign message user refused",
    },
  ])(
    "calls once inner trackPlatform function $method with event named: $message",
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
          platform: appManifest.name,
        },
        null
      );
    }
  );
});

function appManifestFixture(name = "live-app"): LiveAppManifest {
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
    visibility: "complete",
  };
}
