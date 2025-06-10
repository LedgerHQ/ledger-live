import { memoToBufferCV, hexMemoToString, bufferMemoToString, processMemoCV } from "./memoUtils";
import { bufferCV, someCV, noneCV, cvToHex } from "@stacks/transactions";

describe("memoToBufferCV", () => {
  test("should return noneCV for undefined input", () => {
    const result = memoToBufferCV(undefined);
    expect(result).toEqual(noneCV());
  });

  test("should return noneCV for null input", () => {
    const result = memoToBufferCV(null);
    expect(result).toEqual(noneCV());
  });

  test("should return noneCV for empty string", () => {
    const result = memoToBufferCV("");
    expect(result).toEqual(noneCV());
  });

  test("should return someCV with bufferCV for string input", () => {
    const memo = "test memo";
    const result = memoToBufferCV(memo);
    const expected = someCV(bufferCV(Buffer.from(memo)));
    expect(result).toEqual(expected);
  });

  test("should convert non-string input to string before processing", () => {
    const memo = 12345;
    const result = memoToBufferCV(memo);
    const expected = someCV(bufferCV(Buffer.from(String(memo))));
    expect(result).toEqual(expected);
  });
});

describe("hexMemoToString", () => {
  test("should return empty string for undefined input", () => {
    const result = hexMemoToString(undefined);
    expect(result).toBe("");
  });

  test("should return empty string for input without 0x prefix", () => {
    const result = hexMemoToString("deadbeef");
    expect(result).toBe("");
  });

  test("should convert valid hex string to readable string", () => {
    const hexString = "0x74657374206d656d6f"; // "test memo" in hex
    const result = hexMemoToString(hexString);
    expect(result).toBe("test memo");
  });

  test("should remove null characters", () => {
    const hexString = "0x7465737400206d656d6f00"; // "test\0 memo\0" in hex
    const result = hexMemoToString(hexString);
    expect(result).toBe("test memo");
  });

  test("should return empty string on error", () => {
    // Mock Buffer.from to throw an error
    const originalFrom = Buffer.from;
    Buffer.from = jest.fn().mockImplementationOnce(() => {
      throw new Error("Mock error");
    });

    const result = hexMemoToString("0xInvalid");
    expect(result).toBe("");

    // Restore the original function
    Buffer.from = originalFrom;
  });
});

describe("bufferMemoToString", () => {
  test("should return undefined for null input", () => {
    const result = bufferMemoToString(null);
    expect(result).toBeUndefined();
  });

  test("should return undefined for undefined input", () => {
    const result = bufferMemoToString(undefined);
    expect(result).toBeUndefined();
  });

  test("should return undefined for input without type", () => {
    const result = bufferMemoToString({});
    expect(result).toBeUndefined();
  });

  test("should return undefined for non-buffer type", () => {
    const result = bufferMemoToString({ type: "(int)" });
    expect(result).toBeUndefined();
  });

  test("should return undefined when value is not a string", () => {
    const result = bufferMemoToString({ type: "(buff 10)", value: 123 });
    expect(result).toBeUndefined();
  });

  test("should return undefined when value doesn't start with 0x", () => {
    const result = bufferMemoToString({ type: "(buff 10)", value: "deadbeef" });
    expect(result).toBeUndefined();
  });

  test("should convert valid buffer to string", () => {
    const memoJson = {
      type: "(buff 9)",
      value: "0x74657374206d656d6f", // "test memo" in hex
    };
    const result = bufferMemoToString(memoJson);
    expect(result).toBe("test memo");
  });

  test("should return undefined when buffer contains non-printable characters", () => {
    const memoJson = {
      type: "(buff 3)",
      value: "0x010203", // Non-printable bytes
    };
    const result = bufferMemoToString(memoJson);
    expect(result).toBeUndefined();
  });

  test("should handle error during conversion", () => {
    // Mock Buffer.from to throw an error
    const originalFrom = Buffer.from;
    Buffer.from = jest.fn().mockImplementationOnce(() => {
      throw new Error("Mock error");
    });

    const memoJson = {
      type: "(buff 9)",
      value: "0x74657374206d656d6f",
    };
    const result = bufferMemoToString(memoJson);
    expect(result).toBeUndefined();

    // Restore the original function
    Buffer.from = originalFrom;
  });
});

describe("processMemoCV", () => {
  test("should return undefined for undefined input", () => {
    const result = processMemoCV(undefined);
    expect(result).toBeUndefined();
  });

  test("should return undefined for empty string input", () => {
    const result = processMemoCV("");
    expect(result).toBeUndefined();
  });

  test("should process valid memo CV", () => {
    // Create a valid Clarity Value memo (some buffer)
    const memo = "test memo";
    const bufferCv = bufferCV(Buffer.from(memo));
    const someCv = someCV(bufferCv);
    const serialized = cvToHex(someCv);

    const result = processMemoCV(serialized);
    expect(result).toBe(memo);
  });

  test("should handle none CV", () => {
    const noneCv = noneCV();
    const serialized = cvToHex(noneCv);

    const result = processMemoCV(serialized);
    expect(result).toBeUndefined();
  });

  test("should return undefined on deserialization error", () => {
    const result = processMemoCV("invalid");
    expect(result).toBeUndefined();
  });

  test("should handle complex examples", () => {
    // Create a buffer CV with special characters
    const memo = "Hello, World! 123 #$%";
    const bufferCv = bufferCV(Buffer.from(memo));
    const someCv = someCV(bufferCv);
    const serialized = cvToHex(someCv);

    const result = processMemoCV(serialized);
    expect(result).toBe(memo);
  });
});
