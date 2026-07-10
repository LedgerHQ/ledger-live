import { errors, rejectedError } from "../errors";

describe("dapp handler errors", () => {
  it("exposes the EIP-1193 / JSON-RPC error codes", () => {
    expect(errors.UserRejected).toBe(4001);
    expect(errors.InvalidParams).toBe(-32602);
    expect(errors.InternalError).toBe(-32603);
  });

  it("builds a rejected error with the code/message duplicated into data", () => {
    expect(rejectedError(4001, "Transaction declined")).toEqual({
      code: 4001,
      message: "Transaction declined",
      data: { code: 4001, message: "Transaction declined" },
    });
  });

  it("merges extra data fields", () => {
    expect(rejectedError(-32602, "bad", { foo: "bar" })).toEqual({
      code: -32602,
      message: "bad",
      data: { code: -32602, message: "bad", foo: "bar" },
    });
  });
});
