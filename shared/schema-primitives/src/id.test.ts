import { describe, expect, it } from "@jest/globals";
import { AccountIdSchema } from "./id";

describe("AccountIdSchema", () => {
  it("accepts an encoded account id", () => {
    expect(AccountIdSchema.parse("js:2:ethereum:0xabc:")).toBe("js:2:ethereum:0xabc:");
  });

  it("accepts a token account id", () => {
    const id = "js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fusd__coin";
    expect(AccountIdSchema.parse(id)).toBe(id);
  });

  it("rejects an empty id", () => {
    expect(() => AccountIdSchema.parse("")).toThrow();
  });

  it("rejects a blank id", () => {
    expect(() => AccountIdSchema.parse("   ")).toThrow();
  });
});
