import { extractErrorMessage, toError } from "../errorExtraction";

describe("extractErrorMessage", () => {
  describe("null and undefined handling", () => {
    it("should return default message for null", () => {
      expect(extractErrorMessage(null)).toBe("Unknown error occurred");
    });

    it("should return default message for undefined", () => {
      expect(extractErrorMessage(undefined)).toBe("Unknown error occurred");
    });
  });

  describe("Error objects", () => {
    it("should extract message from Error", () => {
      const error = new Error("Something went wrong");
      expect(extractErrorMessage(error)).toBe("Something went wrong");
    });

    it("should extract message from TypeError", () => {
      const error = new TypeError("Type mismatch");
      expect(extractErrorMessage(error)).toBe("Type mismatch");
    });

    it("should return default message for Error with empty message", () => {
      const error = new Error("");
      expect(extractErrorMessage(error)).toBe("Unknown error occurred");
    });

    it("should handle Error with no message", () => {
      const error = new Error();
      expect(extractErrorMessage(error)).toBe("Unknown error occurred");
    });
  });

  describe("objects with message property", () => {
    it("should extract message from object with string message", () => {
      const error = { message: "Custom error message" };
      expect(extractErrorMessage(error)).toBe("Custom error message");
    });

    it("should ignore object with empty string message", () => {
      const error = { message: "" };
      expect(extractErrorMessage(error)).toBe("Unknown error occurred");
    });

    it("should ignore object with non-string message", () => {
      const error = { message: 123 };
      expect(extractErrorMessage(error)).toBe("Unknown error occurred");
    });

    it("should ignore object with null message", () => {
      const error = { message: null };
      expect(extractErrorMessage(error)).toBe("Unknown error occurred");
    });
  });

  describe("string errors", () => {
    it("should return string error directly", () => {
      expect(extractErrorMessage("Error string")).toBe("Error string");
    });

    it("should return default message for empty string", () => {
      expect(extractErrorMessage("")).toBe("Unknown error occurred");
    });

    it("should handle multiline strings", () => {
      const error = "Line 1\nLine 2\nLine 3";
      expect(extractErrorMessage(error)).toBe(error);
    });
  });

  describe("other types", () => {
    it("should stringify number", () => {
      expect(extractErrorMessage(42)).toBe("42");
    });

    it("should stringify boolean", () => {
      expect(extractErrorMessage(true)).toBe("true");
    });

    it("should handle plain objects", () => {
      const error = { code: 404, status: "Not Found" };
      const result = extractErrorMessage(error);
      expect(result).toBe("Unknown error occurred"); // [object Object]
    });

    it("should handle arrays", () => {
      const error = ["error1", "error2"];
      expect(extractErrorMessage(error)).toBe("error1,error2");
    });

    it("should handle Symbol", () => {
      const error = Symbol("error");
      const result = extractErrorMessage(error);
      expect(result).toContain("Symbol");
    });
  });

  describe("edge cases", () => {
    it("should handle circular references", () => {
      const error: { message?: string; self?: unknown } = { message: "Circular error" };
      error.self = error;

      const result = extractErrorMessage(error);
      expect(result).toBe("Circular error");
    });

    it("should handle objects with custom toString", () => {
      const error = {
        toString: () => "Custom toString error",
      };
      expect(extractErrorMessage(error)).toBe("Custom toString error");
    });
  });
});

describe("toError", () => {
  describe("Error objects", () => {
    it("should return Error as-is", () => {
      const error = new Error("Original error");
      const result = toError(error);

      expect(result).toBe(error);
      expect(result.message).toBe("Original error");
    });

    it("should return TypeError as-is", () => {
      const error = new TypeError("Type error");
      const result = toError(error);

      expect(result).toBe(error);
      expect(result instanceof TypeError).toBe(true);
    });
  });

  describe("non-Error values", () => {
    it("should convert string to Error", () => {
      const result = toError("Error message");

      expect(result instanceof Error).toBe(true);
      expect(result.message).toBe("Error message");
    });

    it("should convert number to Error", () => {
      const result = toError(404);

      expect(result instanceof Error).toBe(true);
      expect(result.message).toBe("404");
    });

    it("should convert null to Error", () => {
      const result = toError(null);

      expect(result instanceof Error).toBe(true);
      expect(result.message).toBe("Unknown error occurred");
    });

    it("should convert object with message to Error", () => {
      const error = { message: "Custom message", code: 500 };
      const result = toError(error);

      expect(result instanceof Error).toBe(true);
      expect(result.message).toBe("Custom message");
    });
  });

  describe("stack trace preservation", () => {
    it("should preserve stack trace from object with stack property", () => {
      const error = {
        message: "Error with stack",
        stack: "Error: Error with stack\n    at test.js:10:5",
      };

      const result = toError(error);

      expect(result.stack).toBe("Error: Error with stack\n    at test.js:10:5");
    });

    it("should not set stack if stack property is not a string", () => {
      const error = {
        message: "Error message",
        stack: 123,
      };

      const result = toError(error);

      expect(result.message).toBe("Error message");
      expect(typeof result.stack).toBe("string"); // Will have default stack
    });

    it("should create new stack if original has no stack", () => {
      const error = { message: "No stack" };
      const result = toError(error);

      expect(result.stack).toBeDefined();
      expect(typeof result.stack).toBe("string");
    });
  });

  describe("integration with extractErrorMessage", () => {
    it("should use extractErrorMessage for message extraction", () => {
      const error = { message: "Complex error", details: "More info" };
      const result = toError(error);

      expect(result.message).toBe("Complex error");
    });

    it("should handle all extractErrorMessage edge cases", () => {
      const testCases = [
        null,
        undefined,
        "",
        42,
        true,
        { message: "object message" },
        ["array", "error"],
      ];

      testCases.forEach(testCase => {
        const result = toError(testCase);
        expect(result instanceof Error).toBe(true);
        expect(result.message).toBe(extractErrorMessage(testCase));
      });
    });
  });
});
