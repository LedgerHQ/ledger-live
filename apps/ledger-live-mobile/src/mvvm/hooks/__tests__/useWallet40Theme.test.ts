import { computeWallet40Theme } from "LLM/hooks/useWallet40Theme";

describe("computeWallet40Theme", () => {
  describe("when Wallet 4.0 is enabled", () => {
    it("should return black background in dark mode", () => {
      const result = computeWallet40Theme({ theme: "dark", isWallet40Enabled: true });

      expect(result.isDarkMode).toBe(true);
      expect(result.isWallet40Enabled).toBe(true);
      expect(result.isWallet40DarkMode).toBe(true);
      expect(result.backgroundColor).toBe("#000000");
    });

    it("should return default background in light mode", () => {
      const result = computeWallet40Theme({ theme: "light", isWallet40Enabled: true });

      expect(result.isDarkMode).toBe(false);
      expect(result.isWallet40Enabled).toBe(true);
      expect(result.isWallet40DarkMode).toBe(false);
      expect(result.backgroundColor).toBe("background.main");
    });
  });

  describe("when Wallet 4.0 is disabled", () => {
    it("should return default background in dark mode", () => {
      const result = computeWallet40Theme({ theme: "dark", isWallet40Enabled: false });

      expect(result.isDarkMode).toBe(true);
      expect(result.isWallet40Enabled).toBe(false);
      expect(result.isWallet40DarkMode).toBe(false);
      expect(result.backgroundColor).toBe("background.main");
    });

    it("should return default background in light mode", () => {
      const result = computeWallet40Theme({ theme: "light", isWallet40Enabled: false });

      expect(result.isDarkMode).toBe(false);
      expect(result.isWallet40Enabled).toBe(false);
      expect(result.isWallet40DarkMode).toBe(false);
      expect(result.backgroundColor).toBe("background.main");
    });
  });
});
