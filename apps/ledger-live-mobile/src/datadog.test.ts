import { DdLogs } from "@datadog/mobile-react-native";
import { broadcastLogger, customErrorEventMapper } from "./datadog";

jest.mock("@datadog/mobile-react-native", () => ({
  DdLogs: { info: jest.fn(), error: jest.fn() },
  TrackingConsent: {},
  DatadogProvider: { initialize: jest.fn() },
}));

jest.mock("@datadog/mobile-react-navigation", () => ({}));
jest.mock("./const", () => ({ ScreenName: {} }));
jest.mock("./utils/datadogUtils", () => ({ buildFeatureFlagTags: jest.fn(() => ({})) }));

describe("customErrorEventMapper", () => {
  const mapError = customErrorEventMapper(false);

  it("drops Braze content cards sync failures", () => {
    expect(
      mapError({
        message: "BrazeKit.ContentCards.Error.syncFailure",
        stacktrace: "",
      } as Parameters<typeof mapError>[0]),
    ).toBeNull();
  });

  it("keeps unrelated errors", () => {
    const event = {
      message: "Something went wrong",
      stacktrace: "",
      context: {},
    } as Parameters<typeof mapError>[0];

    expect(mapError(event)).toEqual(
      expect.objectContaining({
        message: "Something went wrong",
      }),
    );
  });
});

describe("broadcastLogger", () => {
  it("calls DdLogs.info with correct parameters on success event", () => {
    const infoSpy = jest.spyOn(DdLogs, "info");

    broadcastLogger({
      status: "success",
      appVersion: "1.0.0",
      currencyId: "bitcoin",
      family: "family",
      isTestnet: false,
      isSendMax: true,
      source: { type: "coin-module", name: "ledger-live-mobile", flags: { newSendFlow: true } },
    });

    expect(infoSpy).toHaveBeenCalledWith("broadcast_success", {
      event: {
        status: "success",
        appVersion: "1.0.0",
        currencyId: "bitcoin",
        family: "family",
        isTestnet: false,
        isSendMax: true,
        source: { type: "coin-module", name: "ledger-live-mobile", flags: { newSendFlow: true } },
      },
    });
  });

  it("calls DdLogs.error with correct parameters on failure event", () => {
    const errorSpy = jest.spyOn(DdLogs, "error");
    const error = new Error("tx broadcast failed");
    error.stack = "Error: tx broadcast failed\n  at test:1:1";

    broadcastLogger({
      status: "failure",
      error,
      txPayload: { signature: "signature" },
      appVersion: "1.0.0",
      currencyId: "ethereum",
      family: "family",
      isTestnet: false,
      isSendMax: false,
      source: { type: "coin-module", name: "ledger-live-mobile", flags: { newSendFlow: false } },
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "broadcast_failure",
      "Error",
      "tx broadcast failed",
      "Error: tx broadcast failed\n  at test:1:1",
      {
        event: {
          status: "failure",
          txPayload: { signature: "signature" },
          appVersion: "1.0.0",
          currencyId: "ethereum",
          family: "family",
          isTestnet: false,
          isSendMax: false,
          source: {
            type: "coin-module",
            name: "ledger-live-mobile",
            flags: { newSendFlow: false },
          },
        },
      },
    );
  });
});
