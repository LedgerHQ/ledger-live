import { isOnEarnDashboard } from "./isOnEarnDashboard";

describe("isOnEarnDashboard", () => {
  it("accepts the app root carrying its init params", () => {
    expect(isOnEarnDashboard("https://earn.example/?theme=dark&lang=en&uiVersion=v4")).toBe(true);
  });

  it("accepts a dashboard living under a path of its own", () => {
    expect(isOnEarnDashboard("https://earn.example/en/dashboard?theme=dark")).toBe(true);
  });

  it("rejects the intent flows by path", () => {
    expect(isOnEarnDashboard("https://earn.example/deposit?cryptoAssetId=eth")).toBe(false);
    expect(isOnEarnDashboard("https://earn.example/withdraw")).toBe(false);
    expect(isOnEarnDashboard("https://earn.example/earn-simulator")).toBe(false);
  });

  it("rejects the intent flows by query param", () => {
    expect(isOnEarnDashboard("https://earn.example/?intent=deposit")).toBe(false);
    expect(isOnEarnDashboard("https://earn.example/?intent=withdraw")).toBe(false);
    expect(isOnEarnDashboard("https://earn.example/?intent=simulate")).toBe(false);
  });

  it("ignores an unknown intent value", () => {
    expect(isOnEarnDashboard("https://earn.example/?intent=whatever")).toBe(true);
  });

  it("rejects a URL that is not a loaded page yet", () => {
    expect(isOnEarnDashboard(undefined)).toBe(false);
    expect(isOnEarnDashboard("")).toBe(false);
    expect(isOnEarnDashboard("about:blank")).toBe(false);
    expect(isOnEarnDashboard("not-a-url")).toBe(false);
  });
});
