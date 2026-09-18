import { buildTopUpPath } from "../buildTopUpPath";

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
});
