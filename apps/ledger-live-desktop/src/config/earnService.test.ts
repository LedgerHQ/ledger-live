import { getEarnApiBaseUrl } from "./earnService";

describe("getEarnApiBaseUrl", () => {
  it("uses production when the build configures nothing", () => {
    expect(getEarnApiBaseUrl(undefined)).toBe("https://earn.api.live.ledger.com");
  });

  it("returns the configured url, trimmed", () => {
    expect(getEarnApiBaseUrl(" https://global.api.stg.ledger-test.com/earn ")).toBe(
      "https://global.api.stg.ledger-test.com/earn",
    );
  });

  it("is off when the configured url is empty", () => {
    expect(getEarnApiBaseUrl("")).toBe("");
    expect(getEarnApiBaseUrl("  ")).toBe("");
  });
});
