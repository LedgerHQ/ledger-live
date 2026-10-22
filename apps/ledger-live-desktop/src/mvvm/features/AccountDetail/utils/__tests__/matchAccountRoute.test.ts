import { matchAccountRoute } from "../matchAccountRoute";

describe("matchAccountRoute", () => {
  it("matches a main account route", () => {
    expect(matchAccountRoute("/account/abc")).toEqual({ id: "abc", "*": "" });
  });

  it("matches a token sub-account route", () => {
    expect(matchAccountRoute("/account/parent/token")).toEqual({
      parentId: "parent",
      id: "token",
      "*": "",
    });
  });

  it("returns no params outside account routes", () => {
    expect(matchAccountRoute("/asset/bitcoin")).toEqual({});
  });
});
