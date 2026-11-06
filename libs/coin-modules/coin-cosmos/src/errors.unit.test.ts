import {
  BlockTransactionsMismatch,
  GetBlockError,
  GetBlockInfoError,
  InvalidBlockMessage,
  TransactionResultNotFound,
} from "./errors";

describe.each([
  TransactionResultNotFound,
  BlockTransactionsMismatch,
  InvalidBlockMessage,
  GetBlockError,
  GetBlockInfoError,
])("%p", ErrorClass => {
  it("falls back to its name as message", () => {
    const error = new ErrorClass();

    expect(error).toMatchObject({ name: ErrorClass.name, message: ErrorClass.name });
  });

  it("carries the given message and fields", () => {
    const cause = new RangeError("out of range");

    const error = new ErrorClass("custom", { height: 12, cause });

    expect(error).toMatchObject({ name: ErrorClass.name, message: "custom", height: 12, cause });
  });
});
