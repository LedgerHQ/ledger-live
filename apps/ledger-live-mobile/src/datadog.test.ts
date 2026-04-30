import { DdLogs, DdRum } from "@datadog/mobile-react-native";
import { broadcastLogger } from "./datadog";

jest.mock("@datadog/mobile-react-native", () => ({
  DdLogs: { info: jest.fn() },
  DdRum: { addError: jest.fn() },
  ErrorSource: { SOURCE: "SOURCE" },
  TrackingConsent: {},
  DatadogProvider: { initialize: jest.fn() },
}));

jest.mock("@datadog/mobile-react-navigation", () => ({}));
jest.mock("./const", () => ({ ScreenName: {} }));
jest.mock("./utils/datadogUtils", () => ({ buildFeatureFlagTags: jest.fn(() => ({})) }));

describe("broadcastLogger", () => {
  it("calls DdLogs.info with correct parameters on success event", () => {
    const infoSpy = jest.spyOn(DdLogs, "info");

    broadcastLogger({ status: "success", appVersion: "1.0.0", currencyId: "bitcoin" });

    expect(infoSpy).toHaveBeenCalledWith("broadcast_success", {
      event: { status: "success", appVersion: "1.0.0", currencyId: "bitcoin" },
    });
  });

  it("calls DdRum.addError with correct parameters on failure event", () => {
    const addErrorSpy = jest.spyOn(DdRum, "addError");
    const error = new Error("tx broadcast failed");
    error.stack = "Error: tx broadcast failed\n  at test:1:1";

    broadcastLogger({
      status: "failure",
      error,
      txPayload: "payload",
      appVersion: "1.0.0",
      currencyId: "ethereum",
    });

    expect(addErrorSpy).toHaveBeenCalledWith(
      "broadcast_failure",
      "SOURCE",
      "Error: tx broadcast failed\n  at test:1:1",
      {
        event: {
          status: "failure",
          txPayload: "payload",
          appVersion: "1.0.0",
          currencyId: "ethereum",
          error: { name: "Error", message: "tx broadcast failed" },
        },
      },
    );
  });
});
