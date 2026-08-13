import type { GrpcTypes } from "@mysten/sui/grpc";
import { executionErrorMessage, toAccumulatorEvents } from "./transactions";

const ADDRESS = "0x11a1b7bd0e2c2ea99d2f0a4c47b8f4dc8a2b1c3d4e5f60718293a4b5c6d7e8f90";

const effectsWith = (
  write: Record<string, unknown> | undefined,
): GrpcTypes.TransactionEffects | undefined =>
  ({ changedObjects: [{ accumulatorWrite: write }] }) as unknown as GrpcTypes.TransactionEffects;

describe("toAccumulatorEvents", () => {
  // proto AccumulatorOperation: UNKNOWN = 0, MERGE = 1, SPLIT = 2.
  it.each([
    [1, "merge"],
    [2, "split"],
  ])("maps operation %i to %s", (operation, expected) => {
    const [event] = toAccumulatorEvents(
      effectsWith({ address: ADDRESS, integerValue: 100n, operation, accumulatorType: "0x2::sui" }),
    ) as { operation: string; value: { integer: string } }[];

    expect(event.operation).toBe(expected);
    expect(event.value.integer).toBe("100");
  });

  // A default or unrecognised enum value must not resolve to an operation. `split` is synthesised
  // downstream as a negative balance change, so guessing here inverts the sign of the amount a
  // user sees for an incoming SIP-58 transfer.
  it.each([
    ["unspecified (field absent on the wire)", 0],
    ["a future enum member", 3],
    ["undefined", undefined],
  ])("drops the write when the operation is %s", (_label, operation) => {
    expect(
      toAccumulatorEvents(effectsWith({ address: ADDRESS, integerValue: 100n, operation })),
    ).toEqual([]);
  });

  it.each([
    ["the address is missing", { integerValue: 100n, operation: 1 }],
    ["the value is missing", { address: ADDRESS, operation: 1 }],
    ["there is no accumulator write", undefined],
  ])("drops the write when %s", (_label, write) => {
    expect(toAccumulatorEvents(effectsWith(write))).toEqual([]);
  });

  it("returns nothing when there are no changed objects", () => {
    expect(toAccumulatorEvents(undefined)).toEqual([]);
    expect(toAccumulatorEvents({} as GrpcTypes.TransactionEffects)).toEqual([]);
  });
});

describe("executionErrorMessage", () => {
  it("prefers the error's own message", () => {
    expect(
      executionErrorMessage({ message: "MoveAbort in 0x2::coin: 1", $kind: "MoveAbort" }),
    ).toBe("MoveAbort in 0x2::coin: 1");
  });

  it("falls back to the enum kind when there is no message", () => {
    expect(executionErrorMessage({ $kind: "InsufficientGas", message: "" })).toBe(
      "InsufficientGas",
    );
  });

  // Must match the GraphQL arm's `extractFailureError` fallback so a failed broadcast reads the
  // same on every transport — `logic/broadcast` interpolates this into the thrown message.
  it.each([
    ["an empty object", {}],
    ["null", null],
    ["undefined", undefined],
    ["a string", "boom"],
  ])("returns the shared fallback for %s", (_label, error) => {
    expect(executionErrorMessage(error)).toBe("transaction execution failed");
  });
});
