import { UnitSchema } from "./schema";
import { mockUnit } from "./schema.mock";

describe("UnitSchema", () => {
  it("parses a valid unit", () => {
    const unit = mockUnit();
    expect(UnitSchema.parse(unit)).toEqual(unit);
  });

  it("parses a valid unit with optional fields", () => {
    const unit = mockUnit({ showAllDigits: true, prefixCode: false });
    expect(UnitSchema.parse(unit)).toEqual(unit);
  });

  it("rejects a negative magnitude", () => {
    expect(() => UnitSchema.parse(mockUnit({ magnitude: -1 }))).toThrow();
  });

  it("rejects a float magnitude", () => {
    expect(() => UnitSchema.parse(mockUnit({ magnitude: 1.5 }))).toThrow();
  });

  it("optional fields default to undefined", () => {
    const result = UnitSchema.parse({ name: "Ether", code: "ETH", magnitude: 18 });
    expect(result.showAllDigits).toBeUndefined();
    expect(result.prefixCode).toBeUndefined();
  });
});
