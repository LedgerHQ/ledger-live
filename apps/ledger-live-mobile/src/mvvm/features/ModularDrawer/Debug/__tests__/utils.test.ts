import { getElement, isOneOf, makeOnValueChange } from "../utils";

describe("Debug/utils", () => {
  describe("getElement", () => {
    it('should return undefined when value is "undefined"', () => {
      expect(getElement("undefined")).toBeUndefined();
    });

    it("should return undefined when value is undefined", () => {
      expect(getElement(undefined)).toBeUndefined();
    });

    it("should return the value when it is a valid string", () => {
      expect(getElement("balance")).toBe("balance");
      expect(getElement("numberOfAccounts")).toBe("numberOfAccounts");
    });
  });

  describe("isOneOf", () => {
    const allowed = ["balance", "apy", "marketTrend"] as const;

    it("should return true when value is in allowed list", () => {
      expect(isOneOf("balance", allowed)).toBe(true);
      expect(isOneOf("apy", allowed)).toBe(true);
    });

    it("should return false when value is not in allowed list", () => {
      expect(isOneOf("unknown", allowed)).toBe(false);
      expect(isOneOf("", allowed)).toBe(false);
    });
  });

  describe("makeOnValueChange", () => {
    const allowed = ["balance", "apy", "marketTrend"] as const;

    it("should call setter when value is allowed", () => {
      const setter = jest.fn();
      const handler = makeOnValueChange(allowed, setter);

      handler("balance");
      expect(setter).toHaveBeenCalledWith("balance");

      handler("apy");
      expect(setter).toHaveBeenCalledWith("apy");
    });

    it("should not call setter when value is not allowed", () => {
      const setter = jest.fn();
      const handler = makeOnValueChange(allowed, setter);

      handler("unknown");
      expect(setter).not.toHaveBeenCalled();
    });
  });
});
