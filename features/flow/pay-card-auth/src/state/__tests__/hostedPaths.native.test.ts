import { buildAccessBaanxPath, buildTopUpPath, buildWithdrawalPath } from "../hostedPaths";

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

describe("buildAccessBaanxPath", () => {
  it("addresses the Baanx root with no app id", () => {
    expect(buildAccessBaanxPath()).toBe("/");
  });

  it("names the US app when the holder belongs to it", () => {
    expect(buildAccessBaanxPath("LEDGERUS")).toBe("/?app_id=LEDGERUS");
  });

  it.each([
    ["null", null],
    ["an empty value", ""],
  ])("names no app when the US app id is %s", (_case, usAppId) => {
    expect(buildAccessBaanxPath(usAppId)).toBe("/");
  });
});
