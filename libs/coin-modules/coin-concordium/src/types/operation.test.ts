import { PLT_REJECT_CODES, isPltRejectCode } from "./operation";

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
