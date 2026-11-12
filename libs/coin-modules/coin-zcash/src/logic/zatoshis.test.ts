import { parseZatoshis } from "./zatoshis";

describe("parseZatoshis", () => {
  it("reads an amount wider than a safe integer", () => {
    expect(parseZatoshis("2100000000000000")?.toFixed()).toBe("2100000000000000");
  });

  it.each(["abc", "", "-1", "1.5", "1e39", "1e1000000", undefined])("rejects %p", value => {
    expect(parseZatoshis(value)).toBeUndefined();
  });
});
