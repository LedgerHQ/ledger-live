import { computeWallet40Theme } from "LLM/hooks/useWallet40Theme";

describe("computeWallet40Theme", () => {
  it("should return black background in dark mode", () => {
    const result = computeWallet40Theme({ theme: "dark" });

    expect(result.isDarkMode).toBe(true);
    expect(result.backgroundColor).toBe("#000000");
  });

  it("should return default background in light mode", () => {
    const result = computeWallet40Theme({ theme: "light" });

    expect(result.isDarkMode).toBe(false);
    expect(result.backgroundColor).toBe("background.main");
  });
});
