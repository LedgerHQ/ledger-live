import { groupBySide, onBothSides } from "./sides";

describe("onBothSides", () => {
  it("runs on both sides concurrently and keys the answers by side", async () => {
    await expect(onBothSides(async side => side.toUpperCase())).resolves.toEqual({
      local: "LOCAL",
      remote: "REMOTE",
    });
  });
});

describe("groupBySide", () => {
  it("groups the items by side, keeping their order", () => {
    expect(groupBySide([1, 2, 3, 4], n => (n % 2 ? "local" : "remote"))).toEqual({
      local: [1, 3],
      remote: [2, 4],
    });
  });

  it("gives an empty group to a side without items", () => {
    expect(groupBySide([1], () => "remote")).toEqual({ local: [], remote: [1] });
  });
});
