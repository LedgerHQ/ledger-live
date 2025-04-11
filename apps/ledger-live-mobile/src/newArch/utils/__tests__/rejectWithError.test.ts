import { rejectWithError } from "../rejectWithError";

describe("rejectWithError", () => {
  it("should reject with the provided error", () => {
    const error = new Error("Test error");
    return expect(rejectWithError(error)).rejects.toThrow(error);
  });

  it("should reject with a new Error if the input is not an instance of Error", () => {
    const nonErrorValue = "Test string";
    return expect(rejectWithError(nonErrorValue)).rejects.toThrow(new Error(String(nonErrorValue)));
  });
});
