import { splitList } from "./splitList";

describe("splitList", () => {
  it("splits on whitespace and punctuation, and keeps each value once", () => {
    expect(splitList("a, b;c  a")).toEqual(["a", "b", "c"]);
    expect(splitList(" \n, ")).toEqual([]);
  });
});
