import { mapTxToOperations } from "./logic";

describe("testing transaction without output", () => {
  it("Parse zcash transaction without output", async () => {
    const tx = {
      id: "0b9f98d07eb418fa20573112d3cba6b871d429a06c724a7888ff0886be5213d1",
      inputs: [
        {
          output_hash:
            "2772f3963856f3eb38cb706ec8c2b62fcdeb2ce10f32cf7160afb3873be6f60d",
          output_index: 0,
          value: "5000000000",
          address: "2NCDBM9DAuMrD1T8XDHMxvbTmLutP7at4AB",
          sequence: 4294967294,
        },
      ],
      outputs: [],
      block: {
        hash: "305d4b8d4a6d6ecca0a3dd0216f8ecd090978ed346d1845883c8aa4529d72fc8",
        height: 120,
        time: "2021-07-28T13:34:38Z",
      },
      account: 0,
      index: 0,
      address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
      received_at: "2021-07-28T13:34:38Z",
    };
    const out = mapTxToOperations(
      tx,
      "zcash",
      "zcash 1",
      new Set<string>(),
      new Set<string>()
    );
    expect(out.length).toEqual(0);
  }, 30000);
});
