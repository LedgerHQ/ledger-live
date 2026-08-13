import { toBase64 } from "@mysten/sui/utils";
import { argToJsonRpc, commandToJsonRpc, inputToJsonRpc } from "./transactions";

const ADDRESS = `0x${"ab".repeat(32)}`;
const pure = (bytes: Uint8Array) => ({ $kind: "Pure", Pure: { bytes: toBase64(bytes) } });
const u64Bytes = (value: bigint) => {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, value, true);
  return bytes;
};

describe("argToJsonRpc", () => {
  it.each([
    ["GasCoin", { $kind: "GasCoin" }, "GasCoin"],
    ["Input", { $kind: "Input", Input: 2 }, { Input: 2 }],
    ["Result", { $kind: "Result", Result: 1 }, { Result: 1 }],
    ["NestedResult", { $kind: "NestedResult", NestedResult: [1, 0] }, { NestedResult: [1, 0] }],
  ])("maps %s", (_label, input, expected) => {
    expect(argToJsonRpc(input)).toEqual(expected);
  });

  it.each([
    ["an unknown kind", { $kind: "Something" }],
    ["a non-object", "GasCoin"],
    ["null", null],
  ])("passes %s through unchanged", (_label, input) => {
    expect(argToJsonRpc(input)).toEqual(input);
  });
});

describe("inputToJsonRpc", () => {
  // `getOperationRecipients` selects recipients solely on `valueType === "address"`, so these two
  // branches decide which addresses land in stored operation history.
  it("decodes a 32-byte pure input as an address", () => {
    expect(inputToJsonRpc(pure(new Uint8Array(32).fill(0xab)))).toEqual({
      type: "pure",
      valueType: "address",
      value: ADDRESS,
    });
  });

  it("decodes an 8-byte pure input as a little-endian u64", () => {
    expect(inputToJsonRpc(pure(u64Bytes(350030000000n)))).toEqual({
      type: "pure",
      valueType: "u64",
      value: "350030000000",
    });
  });

  it("preserves u64 values above Number.MAX_SAFE_INTEGER", () => {
    const value = 18446744073709551615n;
    expect(inputToJsonRpc(pure(u64Bytes(value)))).toMatchObject({ value: value.toString() });
  });

  // An unexpected width must claim no type: a wrong `valueType` here would either fabricate a
  // recipient or hide a real one.
  it.each([[1], [4], [16], [33]])("leaves a %i-byte pure input inert", size => {
    expect(inputToJsonRpc(pure(new Uint8Array(size)))).toMatchObject({ valueType: null });
  });

  it("returns a null-valued pure input when bytes are missing", () => {
    expect(inputToJsonRpc({ $kind: "Pure", Pure: {} })).toEqual({
      type: "pure",
      valueType: null,
      value: null,
    });
  });

  it.each([
    [
      "ImmOrOwnedObject",
      { objectId: "0x1", version: 7n, digest: "d1" },
      {
        type: "object",
        objectType: "immOrOwnedObject",
        objectId: "0x1",
        version: "7",
        digest: "d1",
      },
    ],
    [
      "SharedObject",
      { objectId: "0x5", initialSharedVersion: 3n, mutable: true },
      {
        type: "object",
        objectType: "sharedObject",
        objectId: "0x5",
        initialSharedVersion: "3",
        mutable: true,
      },
    ],
    [
      "Receiving",
      { objectId: "0x9", version: 2n, digest: "d2" },
      { type: "object", objectType: "receiving", objectId: "0x9", version: "2", digest: "d2" },
    ],
  ])("maps a %s input", (kind, inner, expected) => {
    expect(inputToJsonRpc({ $kind: "Object", Object: { $kind: kind, [kind]: inner } })).toEqual(
      expected,
    );
  });

  // Coercing unconditionally emitted the literal string "undefined", which is not a version the
  // JSON-RPC shape can carry. The GraphQL arm has no such key when the source lacks one, so the
  // gRPC arm drops it too rather than inventing a value.
  it.each([
    ["ImmOrOwnedObject", { objectId: "0x1", digest: "d1" }, "version"],
    ["SharedObject", { objectId: "0x5", mutable: true }, "initialSharedVersion"],
    ["Receiving", { objectId: "0x9", digest: "d2" }, "version"],
  ])("omits the version on a %s input that carries none", (kind, inner, field) => {
    const mapped = inputToJsonRpc({ $kind: "Object", Object: { $kind: kind, [kind]: inner } });

    expect(mapped).not.toHaveProperty(field);
    expect(mapped).toMatchObject({ objectId: inner.objectId });
  });

  // Version 0 is a real version and a falsy bigint: a truthiness check here would drop it.
  it("keeps a zero version", () => {
    expect(
      inputToJsonRpc({
        $kind: "Object",
        Object: { $kind: "ImmOrOwnedObject", ImmOrOwnedObject: { objectId: "0x1", version: 0n } },
      }),
    ).toMatchObject({ version: "0" });
  });

  // A non-u64 version would stringify to "[object Object]" and read downstream as a real version.
  it("omits a version that is neither string, number, nor bigint", () => {
    const mapped = inputToJsonRpc({
      $kind: "Object",
      Object: {
        $kind: "ImmOrOwnedObject",
        ImmOrOwnedObject: { objectId: "0x1", version: { high: 0, low: 7 } },
      },
    });

    expect(mapped).not.toHaveProperty("version");
    expect(mapped).toMatchObject({ objectId: "0x1" });
  });

  it("passes an unrecognised object kind through unchanged", () => {
    const input = { $kind: "Object", Object: { $kind: "Future" } };
    expect(inputToJsonRpc(input)).toBe(input);
  });
});

describe("commandToJsonRpc", () => {
  it("maps a MoveCall, keeping type_arguments only when present", () => {
    const withTypes = commandToJsonRpc({
      $kind: "MoveCall",
      MoveCall: {
        package: "0x3",
        module: "sui_system",
        function: "request_add_stake",
        typeArguments: ["0x2::sui::SUI"],
        arguments: [{ $kind: "Input", Input: 0 }, { $kind: "GasCoin" }],
      },
    });
    expect(withTypes).toEqual({
      MoveCall: {
        package: "0x3",
        module: "sui_system",
        function: "request_add_stake",
        type_arguments: ["0x2::sui::SUI"],
        arguments: [{ Input: 0 }, "GasCoin"],
      },
    });

    const withoutTypes = commandToJsonRpc({
      $kind: "MoveCall",
      MoveCall: { package: "0x3", module: "m", function: "f", arguments: [] },
    }) as { MoveCall: Record<string, unknown> };
    expect(withoutTypes.MoveCall).not.toHaveProperty("type_arguments");
  });

  it.each([
    [
      "SplitCoins",
      {
        $kind: "SplitCoins",
        SplitCoins: { coin: { $kind: "GasCoin" }, amounts: [{ $kind: "Input", Input: 0 }] },
      },
      { SplitCoins: ["GasCoin", [{ Input: 0 }]] },
    ],
    [
      "TransferObjects",
      {
        $kind: "TransferObjects",
        TransferObjects: {
          objects: [{ $kind: "Result", Result: 0 }],
          address: { $kind: "Input", Input: 1 },
        },
      },
      { TransferObjects: [[{ Result: 0 }], { Input: 1 }] },
    ],
    [
      "MergeCoins",
      {
        $kind: "MergeCoins",
        MergeCoins: { destination: { $kind: "GasCoin" }, sources: [{ $kind: "Input", Input: 3 }] },
      },
      { MergeCoins: ["GasCoin", [{ Input: 3 }]] },
    ],
    [
      "MakeMoveVec without a type",
      { $kind: "MakeMoveVec", MakeMoveVec: { elements: [{ $kind: "Input", Input: 0 }] } },
      { MakeMoveVec: [null, [{ Input: 0 }]] },
    ],
  ])("maps %s", (_label, command, expected) => {
    expect(commandToJsonRpc(command)).toEqual(expected);
  });

  it.each([
    ["an unmapped command kind", { $kind: "Upgrade", Upgrade: {} }],
    ["a kind with no matching payload", { $kind: "SplitCoins" }],
    ["a non-object", 42],
  ])("passes %s through unchanged", (_label, command) => {
    expect(commandToJsonRpc(command)).toEqual(command);
  });

  it("yields an empty argument list when arguments are absent or not an array", () => {
    expect(
      commandToJsonRpc({ $kind: "MoveCall", MoveCall: { package: "0x3", arguments: "nope" } }),
    ).toMatchObject({ MoveCall: { arguments: [] } });
  });
});
