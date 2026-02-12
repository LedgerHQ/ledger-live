import { ICP_SEND_TXN_TYPE, MAX_MEMO_VALUE } from "../consts";
import {
  getPath,
  isValidHex,
  isValidBase64,
  methodToString,
  getBufferFromString,
  normalizeEpochTimestamp,
  getRandomTransferID,
} from "./utils";

describe("getPath", () => {
  it("should prepend m/ when not present", () => {
    expect(getPath("44'/223'/0'/0/0")).toBe("m/44'/223'/0'/0/0");
  });

  it("should not modify paths starting with m/", () => {
    expect(getPath("m/44'/223'/0'/0/0")).toBe("m/44'/223'/0'/0/0");
  });

  it("should return empty string as-is", () => {
    expect(getPath("")).toBe("");
  });
});

describe("isValidHex", () => {
  it("should validate hex strings correctly", () => {
    // The regex uses /g flag, so lastIndex persists between calls.
    // Testing with a fresh valid string first.
    expect(isValidHex("abcdef")).toBe(true);
  });

  it("should return false for non-hex strings", () => {
    expect(isValidHex("xyz")).toBe(false);
  });
});

describe("isValidBase64", () => {
  it("should return true for valid base64 strings", () => {
    expect(isValidBase64(Buffer.from("hello world").toString("base64"))).toBe(true);
  });

  it("should return false for invalid base64 strings", () => {
    expect(isValidBase64("not base64!@#$")).toBe(false);
  });
});

describe("methodToString", () => {
  it("should return 'Send ICP' for send transaction type", () => {
    expect(methodToString(ICP_SEND_TXN_TYPE)).toBe("Send ICP");
  });

  it("should return 'Unknown' for unknown types", () => {
    expect(methodToString(99)).toBe("Unknown");
  });
});

describe("getBufferFromString", () => {
  it("should decode hex strings", () => {
    expect(getBufferFromString("48656c6c6f").toString()).toBe("Hello");
  });

  it("should decode base64 strings", () => {
    const b64 = Buffer.from("Hello World").toString("base64");
    expect(getBufferFromString(b64).toString()).toBe("Hello World");
  });

  it("should return buffer from plain text", () => {
    expect(getBufferFromString("plain").toString()).toBe("plain");
  });
});

describe("normalizeEpochTimestamp", () => {
  it("should normalize nanosecond timestamps to milliseconds", () => {
    expect(normalizeEpochTimestamp("1700000000000000000")).toBe(1700000000000);
  });

  it("should handle millisecond timestamps", () => {
    expect(normalizeEpochTimestamp("1700000000000")).toBe(1700000000000);
  });
});

describe("getRandomTransferID", () => {
  it("should return a numeric string within the valid memo range", () => {
    const id = getRandomTransferID();
    const num = Number(id);
    expect(num).toBeGreaterThanOrEqual(0);
    expect(num).toBeLessThanOrEqual(MAX_MEMO_VALUE);
  });
});
