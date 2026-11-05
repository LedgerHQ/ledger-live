import {
  BlockTransactionsMismatch,
  GetBlockError,
  GetBlockInfoError,
  TransactionResultNotFound,
} from "./errors";

describe("block errors", () => {
  it("names the transaction whose result is missing", () => {
    const error = new TransactionResultNotFound("ABC", 12);

    expect(error).toMatchObject({
      name: "TransactionResultNotFound",
      message: "Missing result for transaction ABC at block height 12",
    });
  });

  it("reports the decoded and raw transaction counts of a mismatching block", () => {
    const error = new BlockTransactionsMismatch(12, 3, 4);

    expect(error).toMatchObject({
      name: "BlockTransactionsMismatch",
      message: "Block 12 returned 3 decoded transactions for 4 raw transactions",
    });
  });

  it.each([
    [GetBlockError, "GetBlockError", "Failed to get block 12"],
    [GetBlockInfoError, "GetBlockInfoError", "Failed to get block info 12"],
  ])("%p keeps the thrown error as cause", (ErrorClass, name, prefix) => {
    const cause = new RangeError("out of range");

    const error = new ErrorClass(12, cause);

    expect(error.name).toBe(name);
    expect(error.message).toBe(`${prefix}: out of range`);
    expect(error.cause).toBe(cause);
  });

  it.each([
    [GetBlockError, "Failed to get block 12: offline"],
    [GetBlockInfoError, "Failed to get block info 12: offline"],
  ])("%p describes a cause that is not an error with its string form", (ErrorClass, message) => {
    const error = new ErrorClass(12, "offline");

    expect(error.message).toBe(message);
    expect(error.cause).toBe("offline");
  });
});
