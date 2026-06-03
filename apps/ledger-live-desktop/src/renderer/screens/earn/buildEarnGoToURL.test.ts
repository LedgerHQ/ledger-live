import { buildEarnGoToURL } from "./buildEarnGoToURL";

describe("buildEarnGoToURL", () => {
  it("appends Earn initialization params to the partner dapp URL", () => {
    const result = buildEarnGoToURL("https://earn.example/?yieldId=tron&accountId=abc", {
      theme: "dark",
      lang: "en",
      uiVersion: "v2",
      lw40enabled: "true",
    });

    const url = new URL(result);
    expect(url.searchParams.get("yieldId")).toBe("tron");
    expect(url.searchParams.get("accountId")).toBe("abc");
    expect(url.searchParams.get("theme")).toBe("dark");
    expect(url.searchParams.get("lang")).toBe("en");
    expect(url.searchParams.get("uiVersion")).toBe("v2");
    expect(url.searchParams.get("lw40enabled")).toBe("true");
  });

  it("returns the original URL when parsing fails", () => {
    expect(buildEarnGoToURL("not-a-valid-url", { theme: "dark" })).toBe("not-a-valid-url");
  });
});
