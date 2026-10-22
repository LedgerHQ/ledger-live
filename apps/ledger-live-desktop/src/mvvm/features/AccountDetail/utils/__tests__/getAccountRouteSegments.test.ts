import { getAccountRouteSegments } from "../getAccountRouteSegments";

describe("getAccountRouteSegments", () => {
  it("returns the main account segment", () => {
    expect(getAccountRouteSegments({ id: "abc" })).toEqual({
      accountSegment: "abc",
      parentSegment: undefined,
    });
  });

  it("returns the token and parent segments", () => {
    expect(getAccountRouteSegments({ id: "token", parentId: "parent" })).toEqual({
      accountSegment: "token",
      parentSegment: "parent",
    });
  });

  it("rebuilds a raw legacy id whose slashes landed in the splat", () => {
    expect(
      getAccountRouteSegments({
        id: "js:2:ethereum:0xabc:+ethereum",
        parentId: "p",
        "*": "erc20/usdc",
      }),
    ).toEqual({ accountSegment: "js:2:ethereum:0xabc:+ethereum/erc20/usdc", parentSegment: "p" });
  });

  it("ignores a splat that is a nested account route", () => {
    expect(
      getAccountRouteSegments({ id: "token", parentId: "parent", "*": "account/whatever" })
        .accountSegment,
    ).toBe("token");
  });
});
