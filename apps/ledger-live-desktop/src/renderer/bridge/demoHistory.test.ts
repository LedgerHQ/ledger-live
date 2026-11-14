import { DEMO_HISTORY_SEED, syncableAccounts } from "./demoHistory";

describe("syncableAccounts", () => {
  const account = (id: string, seedIdentifier: string) => ({ id, seedIdentifier });

  it("drops accounts carrying demo history, which a sync would overwrite", () => {
    const accounts = [
      account("js:2:ethereum:0x380C", DEMO_HISTORY_SEED),
      account("mock:1:bitcoin:", "mock"),
    ];

    expect(syncableAccounts(accounts).map(a => a.id)).toEqual(["mock:1:bitcoin:"]);
  });

  it("keeps everything when nothing is marked", () => {
    const accounts = [account("a", "seed-a"), account("b", "mock")];
    expect(syncableAccounts(accounts)).toHaveLength(2);
  });

  it("keeps the account order it was given", () => {
    const accounts = [
      account("a", "seed-a"),
      account("b", DEMO_HISTORY_SEED),
      account("c", "seed-c"),
    ];
    expect(syncableAccounts(accounts).map(a => a.id)).toEqual(["a", "c"]);
  });
});
