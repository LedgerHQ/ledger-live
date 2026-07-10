import type { RefObject } from "react";
import { safeGetRefValue } from "../safeGetRefValue";

describe("safeGetRefValue", () => {
  it("returns the current value when defined", () => {
    const ref = { current: "value" } as RefObject<string>;
    expect(safeGetRefValue(ref)).toBe("value");
  });

  it("returns the current value for objects", () => {
    const obj = { foo: "bar" };
    const ref = { current: obj } as RefObject<typeof obj>;
    expect(safeGetRefValue(ref)).toBe(obj);
  });

  it("throws when current is null", () => {
    const ref = { current: null } as unknown as RefObject<string>;
    expect(() => safeGetRefValue(ref)).toThrow("Ref object doesn't have a current value");
  });

  it("throws when current is undefined", () => {
    const ref = { current: undefined } as unknown as RefObject<string>;
    expect(() => safeGetRefValue(ref)).toThrow("Ref object doesn't have a current value");
  });

  it("throws when current is a falsy value (0)", () => {
    const ref = { current: 0 } as RefObject<number>;
    expect(() => safeGetRefValue(ref)).toThrow("Ref object doesn't have a current value");
  });
});
