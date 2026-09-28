import { log } from "@ledgerhq/logs";
import { contextLogger } from "./context";

jest.mock("@ledgerhq/logs");
const mockLog = jest.mocked(log);

describe("contextLogger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes strings through without quoting and forwards data unchanged", () => {
    const data = { nested: { value: 1 } };
    contextLogger("tron/test", "syncing account", data);
    expect(mockLog).toHaveBeenCalledWith("tron/test", "syncing account", data);
  });

  it("forwards undefined message as-is", () => {
    contextLogger("tron/test");
    expect(mockLog).toHaveBeenCalledWith("tron/test", undefined, undefined);
  });

  it.each([
    ["number type", () => contextLogger(42, "msg"), "42", "msg"],
    ["number message", () => contextLogger("type", 999), "type", "999"],
    ["bigint type (no surrounding quotes)", () => contextLogger(BigInt(42), "msg"), "42n", "msg"],
    [
      "bigint message (no surrounding quotes)",
      () => contextLogger("type", BigInt(1000)),
      "type",
      "1000n",
    ],
    ["object type", () => contextLogger({ kind: "tron" }, "msg"), '{"kind":"tron"}', "msg"],
    [
      "object message",
      () => contextLogger("type", { error: "network failure" }),
      "type",
      '{"error":"network failure"}',
    ],
  ])("serializes %s", (_, call, expectedType, expectedMessage) => {
    call();
    expect(mockLog).toHaveBeenCalledWith(expectedType, expectedMessage, undefined);
  });

  it("serializes bigint values nested in an object with n suffix", () => {
    contextLogger("tron/test", { amount: BigInt(1000) });
    expect(mockLog).toHaveBeenCalledWith("tron/test", '{"amount":"1000n"}', undefined);
  });

  const shared = { x: 1 };
  it.each([
    ["same-level siblings", { a: shared, b: shared }, '{"a":{"x":1},"b":{"x":1}}'],
    [
      "different nesting depths",
      { a: { deep: shared }, b: shared },
      '{"a":{"deep":{"x":1}},"b":{"x":1}}',
    ],
    [
      "different parents",
      { p1: { ref: shared }, p2: { ref: shared } },
      '{"p1":{"ref":{"x":1}},"p2":{"ref":{"x":1}}}',
    ],
  ])("does not tag a shared non-cyclic object as circular (%s)", (_, value, expected) => {
    contextLogger("type", value);
    expect(mockLog).toHaveBeenCalledWith("type", expected, undefined);
  });

  it.each([
    ["type", (circular: unknown) => contextLogger(circular, "msg"), '{"self":"[Circular]"}', "msg"],
    [
      "message",
      (circular: unknown) => contextLogger("type", circular),
      "type",
      '{"self":"[Circular]"}',
    ],
  ])(
    "replaces circular references in %s with [Circular]",
    (_, call, expectedType, expectedMessage) => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      call(circular);
      expect(mockLog).toHaveBeenCalledWith(expectedType, expectedMessage, undefined);
    },
  );
});
