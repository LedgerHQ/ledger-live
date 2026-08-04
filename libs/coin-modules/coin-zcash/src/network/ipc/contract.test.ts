import { ZCASH_IPC } from "./contract";

// The renderer client, the main-process host and the utility process are three
// separate bundles agreeing only on these strings, and the Zcash chain-adapter
// of `coin-bitcoin` declares the very same channel names. A channel added
// without the prefix would resolve to no handler at runtime, which is why the
// prefix is asserted here rather than left to the reviewer's eye.
describe("the IPC channels of this module", () => {
  it("all live under the zcash: prefix the host registers", () => {
    const offPrefix = Object.values(ZCASH_IPC).filter(channel => !channel.startsWith("zcash:"));
    expect(offPrefix).toEqual([]);
  });
});
