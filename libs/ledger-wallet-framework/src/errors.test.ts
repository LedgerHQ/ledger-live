import { ChainReadUnsupportedError } from "./errors";

describe("ChainReadUnsupportedError", () => {
  it("is an Error a hook recognises with instanceof", () => {
    const error = new ChainReadUnsupportedError();

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ChainReadUnsupportedError);
    expect(error.name).toBe("ChainReadUnsupportedError");
    expect(error.message).toBe("ChainReadUnsupportedError");
    expect(error.cause).toBeUndefined();
    expect(Object.keys(error)).toEqual(["name"]);
  });

  it("keeps its message, fields and cause", () => {
    const cause = new Error("METHOD_NOT_ALLOWED");
    const error = new ChainReadUnsupportedError(
      "getTransactionInfo is not served",
      { read: "getTransactionInfo" },
      { cause },
    );

    expect(error.message).toBe("getTransactionInfo is not served");
    expect(error.read).toBe("getTransactionInfo");
    expect(error.cause).toBe(cause);
  });
});
