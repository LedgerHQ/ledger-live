import { getSafeStringLinks, isAbsoluteUrl } from "./index";

describe("getSafeStringLinks", () => {
  describe("returns an empty array", () => {
    it("when error is undefined", () => {
      expect(getSafeStringLinks(undefined)).toEqual([]);
    });

    it("when error is null", () => {
      expect(getSafeStringLinks(null)).toEqual([]);
    });

    it("when error has no links", () => {
      const error = new Error("Test error");
      expect(getSafeStringLinks(error)).toEqual([]);
    });

    it("when error is not an object", () => {
      expect(getSafeStringLinks("not-an-object" as unknown as Error)).toEqual([]);
    });

    it("when error does not have 'links' property", () => {
      const error = { message: "Test error" } as unknown as Error;
      expect(getSafeStringLinks(error)).toEqual([]);
    });

    it("when 'links' is not an array", () => {
      const error = { links: "not-an-array" } as unknown as Error;
      expect(getSafeStringLinks(error)).toEqual([]);
    });
  });

  describe("filters and returns valid links", () => {
    it("filters out non-string links", () => {
      const error = {
        links: ["https://example.com", 123, null, undefined, "/relative/path"],
      } as unknown as Error;
      expect(getSafeStringLinks(error)).toEqual(["https://example.com", "/relative/path"]);
    });

    it("returns all string links", () => {
      const error = {
        links: ["https://example.com", "/relative/path"],
      } as unknown as Error;
      expect(getSafeStringLinks(error)).toEqual(["https://example.com", "/relative/path"]);
    });

    it("returns filtered string links when 'links' is a valid array", () => {
      const error = { links: ["https://example.com", 123, null] } as unknown as Error;
      expect(getSafeStringLinks(error)).toEqual(["https://example.com"]);
    });
  });
});

describe("isAbsoluteUrl", () => {
  it("returns true for absolute URLs", () => {
    expect(isAbsoluteUrl("https://example.com")).toBe(true);
    expect(isAbsoluteUrl("http://example.com")).toBe(true);
  });

  it("returns false for relative URLs", () => {
    expect(isAbsoluteUrl("/relative/path")).toBe(false);
    expect(isAbsoluteUrl("relative/path")).toBe(false);
  });

  it("returns false for invalid URLs", () => {
    expect(isAbsoluteUrl("invalid-url")).toBe(false);
    expect(isAbsoluteUrl("")).toBe(false);
  });
});
