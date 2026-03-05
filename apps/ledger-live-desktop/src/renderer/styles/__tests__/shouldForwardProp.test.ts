import { shouldForwardProp } from "../shouldForwardProp";

describe("shouldForwardProp", () => {
  describe("component targets (non-string)", () => {
    it("forwards all props when target is not a string", () => {
      expect(shouldForwardProp("width", {})).toBe(true);
      expect(shouldForwardProp("height", () => null)).toBe(true);
      expect(shouldForwardProp("backgroundColor", { displayName: "Box" })).toBe(true);
      expect(shouldForwardProp("anyCustomProp", Symbol("component"))).toBe(true);
    });
  });

  describe("DOM element targets (string)", () => {
    it("blocks styled-system / custom props on div", () => {
      expect(shouldForwardProp("width", "div")).toBe(false);
      expect(shouldForwardProp("height", "div")).toBe(false);
      expect(shouldForwardProp("backgroundColor", "div")).toBe(false);
      expect(shouldForwardProp("margin", "div")).toBe(false);
      expect(shouldForwardProp("padding", "div")).toBe(false);
      expect(shouldForwardProp("display", "div")).toBe(false);
      expect(shouldForwardProp("flex", "div")).toBe(false);
      expect(shouldForwardProp("size", "div")).toBe(false);
    });

    it("allows width and height on img", () => {
      expect(shouldForwardProp("width", "img")).toBe(true);
      expect(shouldForwardProp("height", "img")).toBe(true);
    });

    it("allows width, height and size on input", () => {
      expect(shouldForwardProp("width", "input")).toBe(true);
      expect(shouldForwardProp("height", "input")).toBe(true);
      expect(shouldForwardProp("size", "input")).toBe(true);
    });

    it("allows width and height on canvas and video", () => {
      expect(shouldForwardProp("width", "canvas")).toBe(true);
      expect(shouldForwardProp("height", "canvas")).toBe(true);
      expect(shouldForwardProp("width", "video")).toBe(true);
      expect(shouldForwardProp("height", "video")).toBe(true);
    });

    it("blocks size on img (not a valid img attribute)", () => {
      expect(shouldForwardProp("size", "img")).toBe(false);
    });

    it("blocks other blocklisted props on img", () => {
      expect(shouldForwardProp("backgroundColor", "img")).toBe(false);
      expect(shouldForwardProp("display", "img")).toBe(false);
    });

    it("allows standard HTML attributes not in blocklist", () => {
      expect(shouldForwardProp("className", "div")).toBe(true);
      expect(shouldForwardProp("id", "div")).toBe(true);
      expect(shouldForwardProp("data-testid", "div")).toBe(true);
      expect(shouldForwardProp("aria-label", "div")).toBe(true);
      expect(shouldForwardProp("src", "img")).toBe(true);
      expect(shouldForwardProp("alt", "img")).toBe(true);
    });

    it("allows width and height on svg", () => {
      expect(shouldForwardProp("width", "svg")).toBe(true);
      expect(shouldForwardProp("height", "svg")).toBe(true);
    });

    it("for unknown elements uses blocklist only (e.g. span)", () => {
      expect(shouldForwardProp("width", "span")).toBe(false);
      expect(shouldForwardProp("data-foo", "span")).toBe(true);
    });
  });
});
