import { describe, expect, it } from "bun:test";
import { makeEnvelope } from "./response";

describe("makeEnvelope", () => {
  it("returns a success envelope with expected fields", () => {
    const result = makeEnvelope("balances", "bitcoin:main", { items: [] });
    expect(result.status).toBe("success");
    expect(result.command).toBe("balances");
    expect(result.network).toBe("bitcoin:main");
    expect(result.items).toEqual([]);
    expect(typeof result.timestamp).toBe("string");
  });

  it("timestamp is a valid ISO date string", () => {
    const result = makeEnvelope("operations", "ethereum:main", {});
    expect(() => new Date(result.timestamp as string).toISOString()).not.toThrow();
  });

  it("includes account field when provided", () => {
    const result = makeEnvelope("balances", "bitcoin:main", {}, "myaccount");
    expect(result.account).toBe("myaccount");
  });

  it("omits account field when not provided", () => {
    const result = makeEnvelope("balances", "bitcoin:main", {});
    expect("account" in result).toBe(false);
  });

  it("spreads data fields into the envelope", () => {
    const result = makeEnvelope("send", "ethereum:main", { txHash: "0xabc", fee: "1000" });
    expect(result.txHash).toBe("0xabc");
    expect(result.fee).toBe("1000");
  });
});
