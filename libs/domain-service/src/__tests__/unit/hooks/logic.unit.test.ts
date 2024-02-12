import { isError, isLoaded } from "../../../hooks/logic";
import { DomainServiceStatus } from "../../../hooks/types";

describe("type gards", () => {
  describe("isLoaded", () => {
    it("should return that a domain is loaded", () => {
      const domain: DomainServiceStatus = {
        status: "loaded",
        resolutions: [],
        updatedAt: 0,
      };
      expect(isLoaded(domain)).toBe(true);
    });

    it("should return that a domain is not loaded", () => {
      const domain: DomainServiceStatus = {
        status: "loading",
      };
      expect(isLoaded(domain)).toBe(false);
    });
  });

  describe("isError", () => {
    it("should return that a domain is an error", () => {
      const domain: DomainServiceStatus = {
        status: "error",
        error: new Error(),
        updatedAt: 0,
      };
      expect(isError(domain)).toBe(true);
    });

    it("should return that a domain is not error", () => {
      const domain: DomainServiceStatus = {
        status: "loading",
      };
      expect(isError(domain)).toBe(false);
    });
  });
});
