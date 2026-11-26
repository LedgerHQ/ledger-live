import { toDatadogViewName } from "./viewName";

describe("toDatadogViewName", () => {
  it.each([
    ["/", "portfolio"],
    ["", "portfolio"],
    ["/accounts", "accounts"],
    ["/manager/reload", "manager"],
    ["/platform/moonpay", "platform"],
    ["/card-new-wallet", "card-new-wallet"],
    ["/USBTroubleshooting", "USBTroubleshooting"],
  ])("should name the view of %p %p", (routePath, viewName) => {
    expect(toDatadogViewName(routePath)).toBe(viewName);
  });

  it("should keep the account id of an account route out of the view name", () => {
    expect(toDatadogViewName("/account/js:2:bitcoin:xpub6C8aARQ2:native_segwit/history")).toBe(
      "account",
    );
  });

  it("should ignore the query string of the route", () => {
    expect(toDatadogViewName("/accounts?tab=tokens")).toBe("accounts");
  });

  it.each([
    "/0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "/bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    "/a".padEnd(43, "a"),
  ])("should fall back to a fixed name when the first segment %p is not a static word", route => {
    expect(toDatadogViewName(route)).toBe("other");
  });
});
