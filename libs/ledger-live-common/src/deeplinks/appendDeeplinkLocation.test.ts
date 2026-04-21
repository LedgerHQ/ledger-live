import "../__tests__/test-helpers/setup";
import { appendDeeplinkLocation, appendDeeplinkLocationIfDefined } from "./index";

describe("appendDeeplinkLocation", () => {
  it("appends deeplinkLocation for ledgerlive URLs", () => {
    expect(appendDeeplinkLocation("ledgerlive://portfolio", "portfolio")).toBe(
      "ledgerlive://portfolio?deeplinkLocation=portfolio",
    );
  });

  it("appends deeplinkLocation for ledgerwallet URLs", () => {
    expect(appendDeeplinkLocation("ledgerwallet://open", "notification_center")).toBe(
      "ledgerwallet://open?deeplinkLocation=notification_center",
    );
  });

  it("does not append deeplinkLocation for non-Ledger URLs", () => {
    expect(appendDeeplinkLocation("https://example.com", "portfolio")).toBe("https://example.com");
  });

  it("returns the original value for malformed URLs", () => {
    expect(appendDeeplinkLocation("not-a-url", "portfolio")).toBe("not-a-url");
  });
});

describe("appendDeeplinkLocationIfDefined", () => {
  it("returns undefined when urlValue is undefined", () => {
    expect(appendDeeplinkLocationIfDefined(undefined, "portfolio")).toBeUndefined();
  });

  it("appends deeplinkLocation when urlValue is defined", () => {
    expect(appendDeeplinkLocationIfDefined("ledgerlive://portfolio", "portfolio")).toBe(
      "ledgerlive://portfolio?deeplinkLocation=portfolio",
    );
  });
});
