import { PortfolioApiError } from "./errors";
import { pageOf } from "./pagination";

describe("pageOf", () => {
  it("pages from an offset token", () => {
    expect(pageOf([1, 2, 3], { size: 2 })).toEqual({ items: [1, 2], nextToken: "2" });
    expect(pageOf([1, 2, 3], { size: 2, token: "2" })).toEqual({ items: [3] });
    expect(pageOf([1, 2, 3])).toEqual({ items: [1, 2, 3] });
  });

  it.each(["x", "-1", "1.5"])("answers a bad request for the token %s", token => {
    expect(() => pageOf([1], { token })).toThrow(PortfolioApiError);
  });
});
