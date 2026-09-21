import { buildHostedUrl, buildTopUpPath, buildWithdrawalPath } from "../buildHostedUrl";

describe("buildHostedUrl", () => {
  it("addresses the path on the base it was given", () => {
    expect(buildHostedUrl("https://provider.test", "/onboarding/signup")).toBe(
      "https://provider.test/onboarding/signup",
    );
  });

  it("keeps the query the path carries", () => {
    expect(buildHostedUrl("https://provider.test", "/kyc?step=2")).toBe(
      "https://provider.test/kyc?step=2",
    );
  });

  it("takes the base of a host that carries a path of its own", () => {
    expect(buildHostedUrl("https://provider.test/tenant", "/onboarding/signup")).toBe(
      "https://provider.test/onboarding/signup",
    );
  });

  it("refuses a base that is not https", () => {
    expect(() => buildHostedUrl("http://provider.test", "/onboarding/signup")).toThrow(
      /must be https/,
    );
  });

  it.each([undefined, ""])("refuses the base %p", base => {
    expect(() => buildHostedUrl(base, "/onboarding/signup")).toThrow(/no base URL/);
  });

  it.each([
    "https://attacker.test/onboarding/signup",
    "//attacker.test/onboarding/signup",
    "https://provider.test.attacker.test/onboarding/signup",
    "http://provider.test/onboarding/signup",
  ])("refuses the path %p, which leaves the base origin", path => {
    expect(() => buildHostedUrl("https://provider.test", path)).toThrow(/must stay on/);
  });

  it("takes a path that names the base origin in full", () => {
    expect(buildHostedUrl("https://provider.test", "https://provider.test/kyc")).toBe(
      "https://provider.test/kyc",
    );
  });
});

describe("buildTopUpPath", () => {
  it("addresses the top up page", () => {
    expect(buildTopUpPath()).toBe("/topup");
  });

  it("names the US app when the holder belongs to it", () => {
    expect(buildTopUpPath("LEDGERUS")).toBe("/topup?app_id=LEDGERUS");
  });

  it("encodes the app id", () => {
    expect(buildTopUpPath("ledger us&x")).toBe("/topup?app_id=ledger+us%26x");
  });

  it.each([
    ["null", null],
    ["an empty value", ""],
  ])("names no app when the US app id is %s", (_case, usAppId) => {
    expect(buildTopUpPath(usAppId)).toBe("/topup");
  });

  it("pre-selects the currency the caller names", () => {
    expect(buildTopUpPath(null, "btc")).toBe("/topup?currency=btc");
  });

  it("names the US app and the currency together", () => {
    expect(buildTopUpPath("LEDGERUS", "btc")).toBe("/topup?app_id=LEDGERUS&currency=btc");
  });

  it.each([
    ["null", null],
    ["an empty value", ""],
  ])("pre-selects no currency when it is %s", (_case, currency) => {
    expect(buildTopUpPath(null, currency)).toBe("/topup");
  });
});

describe("buildWithdrawalPath", () => {
  it("addresses the withdrawal page", () => {
    expect(buildWithdrawalPath()).toBe("/withdrawal");
  });

  it("names the US app and the currency together", () => {
    expect(buildWithdrawalPath("LEDGERUS", "BTC")).toBe("/withdrawal?app_id=LEDGERUS&currency=BTC");
  });

  it.each([
    ["null", null],
    ["an empty value", ""],
  ])("names no app and no currency when both are %s", (_case, value) => {
    expect(buildWithdrawalPath(value, value)).toBe("/withdrawal");
  });
});
