import { isWalletConnectUrl, isWalletConnectLink, getProxyURL, isScreenInState } from "../utils";
import type { NavigationState, PartialState } from "@react-navigation/native";

describe("isWalletConnectUrl", () => {
  it("returns true for wc: scheme URLs", () => {
    expect(isWalletConnectUrl("wc:abc123")).toBe(true);
  });

  it("returns false for non-wc URLs", () => {
    expect(isWalletConnectUrl("ledgerlive://earn")).toBe(false);
  });
});

describe("isWalletConnectLink", () => {
  it("returns true for raw wc: URIs", () => {
    expect(isWalletConnectLink("wc:abc123")).toBe(true);
  });

  it("returns true for ledgerwallet://wc links", () => {
    expect(isWalletConnectLink("ledgerwallet://wc?uri=wc:abc")).toBe(true);
  });

  it("returns true for ledgerlive://wc links", () => {
    expect(isWalletConnectLink("ledgerlive://wc?uri=wc:abc")).toBe(true);
  });

  it("returns true for https://ledger.com/wc links", () => {
    expect(isWalletConnectLink("https://ledger.com/wc?uri=wc:abc")).toBe(true);
  });

  it("returns false for unrelated links", () => {
    expect(isWalletConnectLink("ledgerlive://earn")).toBe(false);
  });
});

describe("getProxyURL", () => {
  it("replaces discover with recover for protect platform", () => {
    const result = getProxyURL("ledgerlive://discover/protectdata");
    expect(result).toBe("ledgerlive://recover/protectdata");
  });

  it("does not modify non-protect discover URLs", () => {
    const url = "ledgerlive://discover/paraswap";
    expect(getProxyURL(url)).toBe(url);
  });

  it("wraps raw wc: URIs in a ledgerlive://wc?uri= envelope", () => {
    const wcUri = "wc:abc123";
    const result = getProxyURL(wcUri);
    expect(result).toContain("ledgerlive://wc?uri=");
    expect(result).toContain(encodeURIComponent(wcUri));
  });

  it("replaces platform with discover for the default BUY_SELL_UI app", () => {
    // Import the constant to check — if buySellUi appId isn't known we pass it explicitly
    const result = getProxyURL("ledgerlive://platform/buy-sell-ui-app", "buy-sell-ui-app");
    expect(result).toContain("discover");
  });

  it("returns the URL unchanged for unrelated deep links", () => {
    const url = "ledgerlive://earn?action=stake";
    expect(getProxyURL(url)).toBe(url);
  });
});

describe("isScreenInState", () => {
  it("returns false for undefined state", () => {
    expect(isScreenInState("Earn", undefined)).toBe(false);
  });

  it("finds a top-level screen by name", () => {
    const state = { routes: [{ name: "Earn" }] } as unknown as NavigationState;
    expect(isScreenInState("Earn", state)).toBe(true);
  });

  it("returns false when screen is not present", () => {
    const state = { routes: [{ name: "Portfolio" }] } as unknown as NavigationState;
    expect(isScreenInState("Earn", state)).toBe(false);
  });

  it("finds a screen nested inside a child state", () => {
    const state = {
      routes: [
        {
          name: "Main",
          state: {
            routes: [{ name: "Earn" }],
          },
        },
      ],
    } as unknown as PartialState<NavigationState>;
    expect(isScreenInState("Earn", state)).toBe(true);
  });

  it("returns false for deeply nested missing screen", () => {
    const state = {
      routes: [
        {
          name: "Main",
          state: {
            routes: [{ name: "Portfolio" }],
          },
        },
      ],
    } as unknown as PartialState<NavigationState>;
    expect(isScreenInState("Earn", state)).toBe(false);
  });
});
