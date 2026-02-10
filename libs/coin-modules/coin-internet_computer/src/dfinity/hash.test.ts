import { encode, serializeTransaction, hashTransaction, TransactionParams } from "./hash";

describe("encode", () => {
  it("should return a Buffer", () => {
    const result = encode("test");
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("should encode a number", () => {
    const result = encode(42);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should produce deterministic output", () => {
    const result1 = encode("hello");
    const result2 = encode("hello");
    expect(result1.toString("hex")).toBe(result2.toString("hex"));
  });

  it("should encode a Map", () => {
    const map = new Map();
    map.set(0, "value");
    const result = encode(map);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("serializeTransaction", () => {
  const baseParams: TransactionParams = {
    from: "sender_address",
    to: "recipient_address",
    amount: BigInt(100000000),
    fee: BigInt(10000),
    memo: BigInt(0),
    created_at_time: BigInt(1700000000000000000),
  };

  it("should return a hex string", () => {
    const result = serializeTransaction(baseParams);
    expect(typeof result).toBe("string");
    expect(/^[0-9a-f]+$/.test(result)).toBe(true);
  });

  it("should produce deterministic output for same inputs", () => {
    const result1 = serializeTransaction(baseParams);
    const result2 = serializeTransaction(baseParams);
    expect(result1).toBe(result2);
  });

  it("should produce different output for different amounts", () => {
    const params2 = { ...baseParams, amount: BigInt(200000000) };
    const result1 = serializeTransaction(baseParams);
    const result2 = serializeTransaction(params2);
    expect(result1).not.toBe(result2);
  });

  it("should produce different output for different recipients", () => {
    const params2 = { ...baseParams, to: "other_recipient" };
    const result1 = serializeTransaction(baseParams);
    const result2 = serializeTransaction(params2);
    expect(result1).not.toBe(result2);
  });

  it("should handle zero created_at_time", () => {
    const params = { ...baseParams, created_at_time: BigInt(0) };
    const result = serializeTransaction(params);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should handle negative created_at_time by using 0", () => {
    const params = { ...baseParams, created_at_time: BigInt(-1) };
    const paramsZero = { ...baseParams, created_at_time: BigInt(0) };
    const result = serializeTransaction(params);
    const resultZero = serializeTransaction(paramsZero);
    expect(result).toBe(resultZero);
  });
});

describe("hashTransaction", () => {
  const baseParams: TransactionParams = {
    from: "sender_address",
    to: "recipient_address",
    amount: BigInt(100000000),
    fee: BigInt(10000),
    memo: BigInt(0),
    created_at_time: BigInt(1700000000000000000),
  };

  it("should return a 64-character hex string (SHA-256)", () => {
    const result = hashTransaction(baseParams);
    expect(typeof result).toBe("string");
    expect(result.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(result)).toBe(true);
  });

  it("should produce deterministic output for same inputs", () => {
    const result1 = hashTransaction(baseParams);
    const result2 = hashTransaction(baseParams);
    expect(result1).toBe(result2);
  });

  it("should produce different hashes for different inputs", () => {
    const params2 = { ...baseParams, amount: BigInt(200000000) };
    const hash1 = hashTransaction(baseParams);
    const hash2 = hashTransaction(params2);
    expect(hash1).not.toBe(hash2);
  });

  it("should produce a different value than serializeTransaction", () => {
    const serialized = serializeTransaction(baseParams);
    const hashed = hashTransaction(baseParams);
    expect(serialized).not.toBe(hashed);
  });
});
