import { protoValueToJson } from "./struct";

const str = (stringValue: string) => ({ kind: { oneofKind: "stringValue", stringValue } });
const num = (numberValue: number) => ({ kind: { oneofKind: "numberValue", numberValue } });
const bool = (boolValue: boolean) => ({ kind: { oneofKind: "boolValue", boolValue } });
const nul = () => ({ kind: { oneofKind: "nullValue", nullValue: 0 } });
const list = (...values: unknown[]) => ({
  kind: { oneofKind: "listValue", listValue: { values } },
});
const struct = (fields: Record<string, unknown>) => ({
  kind: { oneofKind: "structValue", structValue: { fields } },
});

describe("protoValueToJson", () => {
  it.each([
    ["string", str("0x2::sui::SUI"), "0x2::sui::SUI"],
    ["number", num(42), 42],
    ["bool", bool(true), true],
    ["null", nul(), null],
  ])("unwraps a %s scalar", (_label, input, expected) => {
    expect(protoValueToJson(input)).toBe(expected);
  });

  it("unwraps nested structs and lists into plain JSON", () => {
    const input = struct({
      epoch: str("1211"),
      validators: struct({
        active_validators: list(
          struct({ metadata: struct({ sui_address: str("0xval1") }) }),
          struct({ metadata: struct({ sui_address: str("0xval2") }) }),
        ),
      }),
    });

    expect(protoValueToJson(input)).toEqual({
      epoch: "1211",
      validators: {
        active_validators: [
          { metadata: { sui_address: "0xval1" } },
          { metadata: { sui_address: "0xval2" } },
        ],
      },
    });
  });

  // Guards the precision contract: a u64 past 2^53 must survive byte-identical.
  it("leaves u64 strings as strings rather than coercing to number", () => {
    const balance = "18446744073709551615";

    expect(protoValueToJson(struct({ sui_balance: str(balance) }))).toEqual({
      sui_balance: balance,
    });
  });

  it("returns empty containers for empty structs and lists", () => {
    expect(protoValueToJson(struct({}))).toEqual({});
    expect(protoValueToJson(list())).toEqual([]);
  });

  it.each([
    ["undefined", undefined],
    ["a value with no kind", {}],
    ["an unset oneof", { kind: { oneofKind: undefined } }],
    ["an unrecognised oneof", { kind: { oneofKind: "somethingNew", somethingNew: 1 } }],
  ])("returns undefined for %s", (_label, input) => {
    expect(protoValueToJson(input)).toBeUndefined();
  });

  it("drops unrecognised entries but keeps their siblings", () => {
    const input = struct({ good: str("kept"), odd: { kind: { oneofKind: undefined } } });

    expect(protoValueToJson(input)).toEqual({ good: "kept", odd: undefined });
  });
});
