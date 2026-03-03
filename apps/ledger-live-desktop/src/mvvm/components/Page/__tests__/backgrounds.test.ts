import { getPageBackground } from "../backgrounds";

jest.mock("~/renderer/images/backgrounds/light.webp", () => "light.webp");
jest.mock("~/renderer/images/backgrounds/home.webp", () => "home.webp");
jest.mock("~/renderer/images/backgrounds/card.webp", () => "card.webp");
jest.mock("~/renderer/images/backgrounds/swap.webp", () => "swap.webp");
jest.mock("~/renderer/images/backgrounds/earn.webp", () => "earn.webp");

describe("getPageBackground", () => {
  describe("light theme", () => {
    it("returns light background for supported pages", () => {
      expect(getPageBackground("/", "light")).toBe("light.webp");

      expect(getPageBackground("/card-new-wallet", "light")).toBe("light.webp");
      expect(getPageBackground("/swap", "light")).toBe("light.webp");
      expect(getPageBackground("/swap/bridge", "light")).toBe("light.webp");
      expect(getPageBackground("/exchange", "light")).toBe("light.webp");
      expect(getPageBackground("/earn", "light")).toBe("light.webp");
    });

    it("returns undefined for pages without a background", () => {
      expect(getPageBackground("/market", "light")).toBeUndefined();
      expect(getPageBackground("/analytics", "light")).toBeUndefined();
      expect(getPageBackground("/accounts", "light")).toBeUndefined();
      expect(getPageBackground("/settings", "light")).toBeUndefined();
    });
  });

  describe("dark theme", () => {
    it("returns page-specific background for home", () => {
      expect(getPageBackground("/", "dark")).toBe("home.webp");
    });

    it("returns page-specific background for card", () => {
      expect(getPageBackground("/card-new-wallet", "dark")).toBe("card.webp");
    });

    it("returns page-specific background for swap and exchange", () => {
      expect(getPageBackground("/swap", "dark")).toBe("swap.webp");
      expect(getPageBackground("/swap/bridge", "dark")).toBe("swap.webp");
      expect(getPageBackground("/exchange", "dark")).toBe("swap.webp");
      expect(getPageBackground("/exchange/buy", "dark")).toBe("swap.webp");
    });

    it("returns page-specific background for earn", () => {
      expect(getPageBackground("/earn", "dark")).toBe("earn.webp");
    });

    it("returns undefined for pages without a background", () => {
      expect(getPageBackground("/market", "dark")).toBeUndefined();
      expect(getPageBackground("/analytics", "dark")).toBeUndefined();
      expect(getPageBackground("/accounts", "dark")).toBeUndefined();
      expect(getPageBackground("/settings", "dark")).toBeUndefined();
    });
  });
});
