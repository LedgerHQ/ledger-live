import { getPageBackground, preloadBackgrounds, PAGE_BACKGROUNDS } from "../backgrounds";

const knownRoutes = Object.keys(PAGE_BACKGROUNDS);

describe("backgrounds", () => {
  describe("getPageBackground", () => {
    it.each(knownRoutes)("should return a background for %s in dark theme", route => {
      expect(getPageBackground(route, "dark")).toBeDefined();
    });

    it.each(knownRoutes)("should return a background for %s in light theme", route => {
      expect(getPageBackground(route, "light")).toBeDefined();
    });

    it("should return different backgrounds for light and dark themes", () => {
      const light = getPageBackground("/", "light");
      const dark = getPageBackground("/", "dark");
      expect(light).not.toBe(dark);
    });

    it("should return undefined for unknown routes", () => {
      expect(getPageBackground("/settings", "dark")).toBeUndefined();
      expect(getPageBackground("/accounts", "dark")).toBeUndefined();
    });

    it("should match route by first segment", () => {
      expect(getPageBackground("/swap/history", "dark")).toBeDefined();
    });
  });

  describe("preloadBackgrounds", () => {
    it("should create Image instances to preload assets", () => {
      const spy = jest.spyOn(globalThis, "Image");
      preloadBackgrounds();
      expect(spy.mock.instances.length).toBeGreaterThan(0);
      spy.mockRestore();
    });
  });
});
