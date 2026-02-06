import { pathnameToActive, isSideBarNavValue } from "../helpers";
import { SIDEBAR_VALUE_TO_PATH } from "../constants";

describe("pathnameToActive", () => {
  it.each([
    { pathname: SIDEBAR_VALUE_TO_PATH.home, expected: "home" },
    { pathname: "/asset/bitcoin", expected: "home" },
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
  ])('should return "$expected" for pathname "$pathname"', ({ pathname, expected }) => {
    expect(pathnameToActive(pathname, undefined)).toBe(expected);
  });

  it.each([
    { pathname: "/refer-a-friend", referPath: "/refer-a-friend" },
    { pathname: "/refer-a-friend/details", referPath: "/refer-a-friend" },
  ])(
    'should return "refer" for pathname "$pathname" with referPath "$referPath"',
    ({ pathname, referPath }) => {
      expect(pathnameToActive(pathname, referPath)).toBe("refer");
    },
  );

  it("should prioritize refer over other matches", () => {
    expect(pathnameToActive("/swap", "/swap")).toBe("refer");
  });

  it.each(["/settings", "/manager", "/refer"])(
    'should return empty string for unmatched path "%s"',
    pathname => {
      expect(pathnameToActive(pathname, undefined)).toBe("");
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
