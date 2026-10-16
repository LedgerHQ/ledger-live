import { groupBySides, onBothSides } from "./sides";
import type { Side } from "./types";

describe("onBothSides", () => {
  it("runs on both sides concurrently and keys the answers by side", async () => {
    await expect(onBothSides(async side => side.toUpperCase())).resolves.toEqual({
      local: "LOCAL",
      remote: "REMOTE",
    });
  });
});

describe("groupBySides", () => {
  const sidesOf = async (n: number): Promise<readonly Side[]> =>
    n % 3 === 0 ? ["local", "remote"] : n % 2 ? ["local"] : ["remote"];

  it("puts each item on every side it goes to, keeping their order", async () => {
    await expect(groupBySides([1, 2, 3, 4], sidesOf)).resolves.toEqual({
      local: [1, 3],
      remote: [2, 3, 4],
    });
  });

  it("gives an empty group to a side without items", async () => {
    await expect(groupBySides([2], sidesOf)).resolves.toEqual({ local: [], remote: [2] });
  });
});
