import { classifyTransactionError, ErrorCategory, toError, unwrapRpcError } from "./errorCategory";

const classify = (error: unknown) => classifyTransactionError(toError(unwrapRpcError(error)));

describe("classifyTransactionError", () => {
  it.each([
    // device / user (sign stage)
    ["DisconnectedDevice", { name: "DisconnectedDevice" }, ErrorCategory.DeviceDisconnected],
    [
      "DisconnectedDeviceDuringOperation",
      { name: "DisconnectedDeviceDuringOperation" },
      ErrorCategory.DeviceDisconnected,
    ],
    ["WrongDeviceForAccount", { name: "WrongDeviceForAccount" }, ErrorCategory.DeviceWrongAccount],
    ["UserRefusedOnDevice", { name: "UserRefusedOnDevice" }, ErrorCategory.UserDeviceRefused],
    [
      "TransactionRefusedOnDevice",
      { name: "TransactionRefusedOnDevice" },
      ErrorCategory.UserDeviceRefused,
    ],
    [
      "DeviceStatusError user-decline (0x6985)",
      { name: "DeviceStatusError", statusCode: 0x6985 },
      ErrorCategory.UserDeviceRefused,
    ],
    [
      "DeviceStatusError other status",
      { name: "DeviceStatusError", statusCode: 0x6a80 },
      ErrorCategory.DeviceDisconnected,
    ],
    [
      "Signature interrupted (message)",
      { message: "Signature interrupted by user" },
      ErrorCategory.UserModalDismissed,
    ],
    [
      "Canceled by user (message)",
      { message: "Canceled by user" },
      ErrorCategory.UserModalDismissed,
    ],
    // gas / blockchain (broadcast stage)
    ["InsufficientFunds", { name: "InsufficientFunds" }, ErrorCategory.GasInsufficientBalance],
    ["NotEnoughBalance", { name: "NotEnoughBalance" }, ErrorCategory.GasInsufficientBalance],
    [
      "REPLACEMENT_UNDERPRICED (message)",
      { message: "replacement_underpriced" },
      ErrorCategory.GasFeeTooLow,
    ],
    ["SequenceNumberError", { name: "SequenceNumberError" }, ErrorCategory.Blockchain],
    ["NetworkError", { name: "NetworkError" }, ErrorCategory.Blockchain],
    ["NONCE_EXPIRED (message)", { message: "nonce_expired: foo" }, ErrorCategory.Blockchain],
    ["unknown", { name: "Error", message: "something weird" }, ErrorCategory.Unknown],
  ])("maps %s", (_label, partial, expected) => {
    expect(classifyTransactionError(Object.assign(new Error(), partial) as Error)).toBe(expected);
  });
});

// Neither the Wallet API's RpcError/ServerError nor Ledger Wallet's dApp-path RpcError sets
// `name`, so without unwrapping every RPC failure would classify as unknown.
describe("unwrapRpcError", () => {
  it("unwraps a dApp provider rejection (EIP-1193 4001) as a dismissal", () => {
    const error = toError(
      unwrapRpcError({ isRpcError: true, code: 4001, reason: "User rejected" }),
    );
    expect(error.name).toBe("UserRejectedRequest");
    expect(classifyTransactionError(error)).toBe(ErrorCategory.UserModalDismissed);
  });

  it("keeps the rpc code as the reported name for other provider errors", () => {
    expect(
      toError(unwrapRpcError({ isRpcError: true, code: 4900, reason: "Disconnected" })).name,
    ).toBe("rpc_4900");
  });

  it("unwraps the original error forwarded inside a Wallet API envelope", () => {
    const error = toError(
      unwrapRpcError({
        getCode: () => -32000,
        getData: () => ({
          code: "UNKNOWN_ERROR",
          data: { name: "UserRefusedOnDevice", message: "declined" },
        }),
      }),
    );
    expect(error.name).toBe("UserRefusedOnDevice");
    expect(classifyTransactionError(error)).toBe(ErrorCategory.UserDeviceRefused);
  });

  it("preserves a nested device status code so it can still be categorised", () => {
    expect(
      classify({
        getCode: () => -32000,
        getData: () => ({
          code: "UNKNOWN_ERROR",
          data: { name: "DeviceStatusError", message: "", statusCode: 0x6985 },
        }),
      }),
    ).toBe(ErrorCategory.UserDeviceRefused);
  });

  it("falls back to the protocol code as the reported name", () => {
    const error = toError(
      unwrapRpcError({ getCode: () => -32000, getData: () => ({ code: "ACCOUNT_NOT_FOUND" }) }),
    );
    expect(error.name).toBe("ACCOUNT_NOT_FOUND");
    expect(classifyTransactionError(error)).toBe(ErrorCategory.Unknown);
  });

  // `code` is `unknown` on both paths, so String(code) could have reported
  // "rpc_[object Object]". rpc_unknown keeps this countable as its own case.
  it.each([
    ["a provider error", { isRpcError: true, code: { nested: true }, reason: "weird" }, "weird"],
    ["a wallet-api envelope", { getCode: () => ({ nested: true }), getData: () => undefined }, ""],
  ])("reports an unreadable code from %s as rpc_unknown", (_label, raw, message) => {
    const error = toError(unwrapRpcError(raw));
    expect(error.name).toBe("rpc_unknown");
    expect(error.message).toBe(message);
    expect(classifyTransactionError(error)).toBe(ErrorCategory.Unknown);
  });

  // The envelope shapes are tried in order; this pins that a serialised error still wins over
  // the protocol code sitting beside it, rather than depending on extractor ordering by luck.
  it("prefers a serialised error over the protocol code beside it", () => {
    const error = toError(
      unwrapRpcError({
        getCode: () => -32000,
        getData: () => ({ code: "ACCOUNT_NOT_FOUND", data: { name: "NotEnoughBalance" } }),
      }),
    );
    expect(error.name).toBe("NotEnoughBalance");
  });

  it("leaves an object with no recognised envelope shape untouched", () => {
    const raw = { getCode: () => 1 };
    expect(unwrapRpcError(raw)).toBe(raw);
  });

  it("leaves a plain error untouched", () => {
    const original = Object.assign(new Error("x"), { name: "NotEnoughBalance" });
    expect(unwrapRpcError(original)).toBe(original);
  });
});

describe("toError", () => {
  it("passes an Error through unchanged", () => {
    const error = new Error("boom");
    expect(toError(error)).toBe(error);
  });

  it("coerces a string, an object and a circular value without throwing", () => {
    expect(toError("boom").message).toBe("boom");
    expect(toError({ a: 1 }).message).toBe('{"a":1}');
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => toError(circular)).not.toThrow();
  });
});
