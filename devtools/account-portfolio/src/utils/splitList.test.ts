import { splitList } from "./splitList";

describe("splitList", () => {
  it.each([
    ["a\nb\nc", ["a", "b", "c"]],
    ["a, b;c  d", ["a", "b", "c", "d"]],
    ["  a  \n\n b ", ["a", "b"]],
    ["a a b a", ["a", "b"]],
    ["", []],
    [" \n, ", []],
  ])("%j -> %j", (text, expected) => {
    expect(splitList(text)).toEqual(expected);
  });
});
