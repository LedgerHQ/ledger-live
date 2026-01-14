import { memoToBufferCV, hexMemoToString, bufferMemoToString, processMemoCV } from "./memoUtils";
import { bufferCV, someCV, noneCV, cvToHex } from "@stacks/transactions";

describe("memoToBufferCV", () => {
  test.each([undefined, null, ""])(
    "should return noneCV for %s input",
    (memo: string | null | undefined) => {
      const result = memoToBufferCV(memo);
      expect(result).toEqual(noneCV());
    },
  );

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
  test.each([undefined, "deadbeef"])(
    "should return empty string for %s",
    (input: string | undefined) => {
      const result = hexMemoToString(input);
      expect(result).toBe("");
    },
  );

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
  test.each([
    null,
    undefined,
    {},
    { type: "(int)" },
    { type: "(buff 10)", value: 123 },
    { type: "(buff 10)", value: "deadbeef" },
  ])("should return undefined for %s", (input: unknown) => {
    const result = bufferMemoToString(input);
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
  test.each([undefined, ""])(
    "should return undefined for %s input",
    (input: string | undefined) => {
      const result = processMemoCV(input);
      expect(result).toBeUndefined();
    },
  );

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
