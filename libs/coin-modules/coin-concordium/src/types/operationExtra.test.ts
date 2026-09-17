import { PLT_REJECT_CODES, isPltRejectCode } from "./operation";
import { readOperationExtra } from "./bridge";

describe("isPltRejectCode", () => {
  it.each([...PLT_REJECT_CODES])("accepts %s", code => {
    expect(isPltRejectCode(code)).toBe(true);
  });

  it.each([
    ["an empty string", ""],
    ["a value outside the set", "operationNotPermitted"],
    ["a prototype key", "constructor"],
    ["another prototype key", "toString"],
    ["a non-string", 7],
    ["an object", {}],
    ["null", null],
    ["undefined", undefined],
  ])("rejects %s", (_label, value) => {
    expect(isPltRejectCode(value)).toBe(false);
  });
});

describe("readOperationExtra", () => {
  it("keeps a memo and a cause it recognises", () => {
    expect(readOperationExtra({ memo: "invoice 41", pltRejectCode: "rejected" })).toEqual({
      memo: "invoice 41",
      pltRejectCode: "rejected",
    });
  });

  it.each([
    ["an empty memo", { memo: "" }],
    ["a non-string memo", { memo: 7 }],
    ["an object memo", { memo: { toString: () => "x" } }],
  ])("drops %s", (_label, extra) => {
    expect(readOperationExtra(extra).memo).toBeUndefined();
  });

  it("drops a cause outside the set", () => {
    expect(
      readOperationExtra({ pltRejectCode: "operationNotPermitted" }).pltRejectCode,
    ).toBeUndefined();
  });

  // Reached for an operation stored before this field existed, and for one whose
  // stored shape is not an object at all.
  it.each([
    ["absent", undefined],
    ["null", null],
    ["a string", "memo"],
    ["an array", []],
  ])("returns nothing when extra is %s", (_label, extra) => {
    expect(readOperationExtra(extra)).toEqual({});
  });

  // Omitted rather than set to undefined, so a spread of the result cannot
  // overwrite a field with undefined under exactOptionalPropertyTypes.
  it("omits absent fields rather than setting them undefined", () => {
    expect(Object.keys(readOperationExtra({ memo: "only a memo" }))).toEqual(["memo"]);
  });
});
