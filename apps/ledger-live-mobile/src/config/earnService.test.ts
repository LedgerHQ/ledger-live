import Config from "react-native-config";
import { getEarnApiBaseUrl } from "./earnService";

describe("getEarnApiBaseUrl", () => {
  it("should use production when the build configures nothing", () => {
    expect(getEarnApiBaseUrl(undefined)).toBe("https://earn.api.live.ledger.com");
  });

  it("should return the configured url, trimmed", () => {
    expect(getEarnApiBaseUrl(" https://global.api.stg.ledger-test.com/earn ")).toBe(
      "https://global.api.stg.ledger-test.com/earn",
    );
  });

  it("should be off when the configured url is empty", () => {
    expect(getEarnApiBaseUrl("")).toBe("");
    expect(getEarnApiBaseUrl("  ")).toBe("");
  });

  it("should read the url of the build's env file by default", () => {
    Config.EARN_API_BASE_URL = "https://earn.config.example";
    try {
      expect(getEarnApiBaseUrl()).toBe("https://earn.config.example");
    } finally {
      delete Config.EARN_API_BASE_URL;
    }
  });
});
