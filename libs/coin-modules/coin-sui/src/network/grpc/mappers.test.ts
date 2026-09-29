import { toBase64 } from "@mysten/sui/utils";
import { toSuiCommand, toSuiInput } from "./transactions";

const ADDRESS = `0x${"ab".repeat(32)}`;
const pure = (bytes: Uint8Array) => ({ $kind: "Pure", Pure: { bytes: toBase64(bytes) } });
const u64Bytes = (value: bigint) => {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, value, true);
  return bytes;
};

describe("toSuiInput", () => {
  // `getOperationRecipients` selects recipients solely on `valueType === "address"`, so these two
  // branches decide which addresses land in stored operation history.
  it("decodes a 32-byte pure input as an address", () => {
    expect(toSuiInput(pure(new Uint8Array(32).fill(0xab)))).toEqual({
      type: "pure",
      valueType: "address",
      value: ADDRESS,
    });
  });

  it("decodes an 8-byte pure input as a little-endian u64", () => {
    expect(toSuiInput(pure(u64Bytes(350030000000n)))).toEqual({
      type: "pure",
      valueType: "u64",
      value: "350030000000",
    });
  });

  it("preserves u64 values above Number.MAX_SAFE_INTEGER", () => {
    const value = 18446744073709551615n;
    expect(toSuiInput(pure(u64Bytes(value)))).toMatchObject({ value: value.toString() });
  });

  // An unexpected width must claim no type: a wrong `valueType` here would either fabricate a
  // recipient or hide a real one.
  it.each([[1], [4], [16], [33]])("leaves a %i-byte pure input inert", size => {
    expect(toSuiInput(pure(new Uint8Array(size)))).toMatchObject({ valueType: null });
  });

  it("returns a null-valued pure input when bytes are missing", () => {
    expect(toSuiInput({ $kind: "Pure", Pure: {} })).toEqual({
      type: "pure",
      valueType: null,
      value: null,
    });
  });

  it.each([
    [
      "ImmOrOwnedObject",
      { objectId: "0x1", version: 7n, digest: "d1" },
      { type: "object", objectType: "immOrOwnedObject", objectId: "0x1" },
    ],
    [
      "SharedObject",
      { objectId: "0x5", initialSharedVersion: 3n, mutable: true },
      { type: "object", objectType: "sharedObject", objectId: "0x5", mutable: true },
    ],
    [
      "Receiving",
      { objectId: "0x9", version: 2n, digest: "d2" },
      { type: "object", objectType: "receiving", objectId: "0x9" },
    ],
  ])("maps a %s input", (kind, inner, expected) => {
    expect(toSuiInput({ $kind: "Object", Object: { $kind: kind, [kind]: inner } })).toEqual(
      expected,
    );
  });

  // `isSettlementTransaction` matches on `mutable === true`; anything else must read as immutable.
  it.each([[false], [undefined], ["true"]])(
    "reads a shared input with mutable=%p as immutable",
    mutable => {
      expect(
        toSuiInput({
          $kind: "Object",
          Object: { $kind: "SharedObject", SharedObject: { objectId: "0x5", mutable } },
        }),
      ).toMatchObject({ mutable: false });
    },
  );

  it("defaults a missing objectId to an empty string", () => {
    expect(
      toSuiInput({ $kind: "Object", Object: { $kind: "ImmOrOwnedObject", ImmOrOwnedObject: {} } }),
    ).toEqual({ type: "object", objectType: "immOrOwnedObject", objectId: "" });
  });

  it.each([
    ["an unrecognised object kind", { $kind: "Object", Object: { $kind: "Future" } }],
    ["an unrecognised input kind", { $kind: "FundsWithdrawal" }],
    ["a non-object", "Pure"],
    ["null", null],
  ])("drops %s", (_label, input) => {
    expect(toSuiInput(input)).toBeNull();
  });
});

describe("toSuiCommand", () => {
  it("keeps a MoveCall's target", () => {
    expect(
      toSuiCommand({
        $kind: "MoveCall",
        MoveCall: {
          package: "0x3",
          module: "sui_system",
          function: "request_add_stake",
          typeArguments: ["0x2::sui::SUI"],
          arguments: [{ $kind: "Input", Input: 0 }, { $kind: "GasCoin" }],
        },
      }),
    ).toEqual({
      MoveCall: { package: "0x3", module: "sui_system", function: "request_add_stake" },
    });
  });

  it("defaults missing MoveCall target fields to empty strings", () => {
    expect(toSuiCommand({ $kind: "MoveCall", MoveCall: { package: "0x3" } })).toEqual({
      MoveCall: { package: "0x3", module: "", function: "" },
    });
  });

  it.each([
    [
      "SplitCoins",
      { $kind: "SplitCoins", SplitCoins: { coin: { $kind: "GasCoin" }, amounts: [] } },
    ],
    ["TransferObjects", { $kind: "TransferObjects", TransferObjects: { objects: [] } }],
    ["MergeCoins", { $kind: "MergeCoins", MergeCoins: { sources: [] } }],
    ["Upgrade", { $kind: "Upgrade", Upgrade: {} }],
    ["MoveCall", { $kind: "MoveCall" }],
  ])("keeps only the kind name of a non-MoveCall (or payload-less) %s command", (kind, command) => {
    expect(toSuiCommand(command)).toEqual({ Other: kind });
  });

  it.each([
    ["a non-object", 42],
    ["null", null],
    ["an object without a kind", {}],
  ])("names %s Unknown", (_label, command) => {
    expect(toSuiCommand(command)).toEqual({ Other: "Unknown" });
  });
});
