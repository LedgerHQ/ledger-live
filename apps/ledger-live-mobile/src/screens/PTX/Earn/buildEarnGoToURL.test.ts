import { buildEarnGoToURL } from "./buildEarnGoToURL";

describe("buildEarnGoToURL", () => {
  it("merges init params into the dapp URL, preserving existing query params", () => {
    const result = buildEarnGoToURL("https://dapp.test/stake?foo=1", {
      intent: "deposit",
      uiVersion: "v4",
    });

    const url = new URL(result);
    expect(url.origin + url.pathname).toBe("https://dapp.test/stake");
    expect(url.searchParams.get("foo")).toBe("1");
    expect(url.searchParams.get("intent")).toBe("deposit");
    expect(url.searchParams.get("uiVersion")).toBe("v4");
  });

  it("skips undefined params", () => {
    const result = buildEarnGoToURL("https://dapp.test/stake", {
      intent: "deposit",
      accountId: undefined,
    });

    const url = new URL(result);
    expect(url.searchParams.get("intent")).toBe("deposit");
    expect(url.searchParams.has("accountId")).toBe(false);
  });

  it("overwrites an existing param with the merged value", () => {
    const result = buildEarnGoToURL("https://dapp.test/stake?intent=stale", { intent: "withdraw" });

    expect(new URL(result).searchParams.get("intent")).toBe("withdraw");
  });

  it("returns the original string when the URL cannot be parsed", () => {
    expect(buildEarnGoToURL("not a url", { intent: "deposit" })).toBe("not a url");
  });
});
