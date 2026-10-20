import { pathnameToActive, isSideBarNavValue } from "../helpers";
import { SIDEBAR_VALUE_TO_PATH } from "../constants";

describe("pathnameToActive", () => {
  it.each([
    { pathname: SIDEBAR_VALUE_TO_PATH.home, expected: "home" },
    { pathname: "/asset/bitcoin", expected: "" },
    { pathname: SIDEBAR_VALUE_TO_PATH.accounts, expected: "accounts" },
    { pathname: "/account/abc-123", expected: "accounts" },
    { pathname: SIDEBAR_VALUE_TO_PATH.swap, expected: "swap" },
    { pathname: "/swap/form", expected: "swap" },
    { pathname: SIDEBAR_VALUE_TO_PATH.earn, expected: "earn" },
    { pathname: SIDEBAR_VALUE_TO_PATH.discover, expected: "discover" },
    { pathname: "/platform/some-app", expected: "discover" },
    { pathname: SIDEBAR_VALUE_TO_PATH.card, expected: "card" },
    { pathname: "/card", expected: "card" },
    { pathname: "/card/something", expected: "card" },
    { pathname: SIDEBAR_VALUE_TO_PATH.paytab, expected: "paytab" },
    { pathname: "/paytab/details", expected: "paytab" },
  ])('should return "$expected" for pathname "$pathname"', ({ pathname, expected }) => {
    expect(pathnameToActive(pathname)).toBe(expected);
  });

  it('should return "accounts" for /cryptos when asset section is enabled', () => {
    expect(pathnameToActive("/cryptos", true)).toBe("accounts");
  });

  it("should return empty string for /cryptos when asset section is disabled", () => {
    expect(pathnameToActive("/cryptos", false)).toBe("");
  });

  it('should return "paytab" for a live app opened from the Pay tab', () => {
    expect(pathnameToActive("/platform/some-app", false, "?returnTo=%2Fpaytab")).toBe("paytab");
  });

  it('should return "discover" for a live app with another returnTo', () => {
    expect(pathnameToActive("/platform/some-app", false, "?returnTo=%2Fswap")).toBe("discover");
  });

  it.each(["/settings", "/manager", "/refer"])(
    'should return empty string for unmatched path "%s"',
    pathname => {
      expect(pathnameToActive(pathname)).toBe("");
    },
  );
});

describe("isSideBarNavValue", () => {
  it.each(Object.keys(SIDEBAR_VALUE_TO_PATH))('should return true for valid value "%s"', value => {
    expect(isSideBarNavValue(value)).toBe(true);
  });

  it.each(["refer", "recover", "unknown", "", "market", "manager"])(
    'should return false for invalid value "%s"',
    value => {
      expect(isSideBarNavValue(value)).toBe(false);
    },
  );
});
