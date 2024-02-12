import BitcoinLikeStorage from "./wallet-btc/storage";

describe("testing transaction data load and export", () => {
  it("testing transaction data load and export", async () => {
    const storage = new BitcoinLikeStorage();
    storage.appendTxs([
      {
        id: "9e1b337875c21f751e70ee2c2c6ee93d8a6733d0f3ba6d139ae6a0479ebcefb0",
        inputs: [],
        outputs: [
          {
            output_index: 0,
            value: "5000000000",
            address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
            output_hash: "9e1b337875c21f751e70ee2c2c6ee93d8a6733d0f3ba6d139ae6a0479ebcefb0",
            block_height: 1,
            rbf: false,
          },
          {
            output_index: 1,
            value: "0",
            address: "<unknown>",
            output_hash: "9e1b337875c21f751e70ee2c2c6ee93d8a6733d0f3ba6d139ae6a0479ebcefb0",
            block_height: 1,
            rbf: false,
          },
        ],
        block: {
          hash: "73c565a6f226978df23480e440b27eb02f307855f50aa3bc72ebb586938f23e0",
          height: 1,
          time: "2021-07-28T13:34:17Z",
        },
        account: 0,
        index: 0,
        address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
        received_at: "2021-07-28T13:34:17Z",
      },
      {
        id: "0b9f98d07eb418fa20573112d3cba6b871d429a06c724a7888ff0886be5213d1",
        inputs: [
          {
            output_hash: "2772f3963856f3eb38cb706ec8c2b62fcdeb2ce10f32cf7160afb3873be6f60d",
            output_index: 0,
            value: "5000000000",
            address: "2NCDBM9DAuMrD1T8XDHMxvbTmLutP7at4AB",
            sequence: 4294967294,
          },
        ],
        outputs: [
          {
            output_index: 0,
            value: "300000000",
            address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
            output_hash: "0b9f98d07eb418fa20573112d3cba6b871d429a06c724a7888ff0886be5213d1",
            block_height: 120,
            rbf: false,
          },
          {
            output_index: 1,
            value: "4699983200",
            address: "2MynSTpze5SDcuLr1DekSV7RVrFpQCo3LeP",
            output_hash: "0b9f98d07eb418fa20573112d3cba6b871d429a06c724a7888ff0886be5213d1",
            block_height: 120,
            rbf: false,
          },
        ],
        block: {
          hash: "305d4b8d4a6d6ecca0a3dd0216f8ecd090978ed346d1845883c8aa4529d72fc8",
          height: 120,
          time: "2021-07-28T13:34:38Z",
        },
        account: 0,
        index: 0,
        address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
        received_at: "2021-07-28T13:34:38Z",
      },
    ]);
    const primaryIndexCopy = Object.assign({}, storage.primaryIndex);
    const accountIndexCopy = Object.assign({}, storage.accountIndex);
    expect(Object.keys(primaryIndexCopy).length).toEqual(2);
    expect(Object.keys(accountIndexCopy).length).toEqual(1);
    /* primaryIndex:
    {
      'mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb-9e1b337875c21f751e70ee2c2c6ee93d8a6733d0f3ba6d139ae6a0479ebcefb0': 0,
      'mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb-0b9f98d07eb418fa20573112d3cba6b871d429a06c724a7888ff0886be5213d1': 1
    }
      accountIndex:
      { '0-0': [ 0, 1 ] }
    */
    expect(Object.keys(accountIndexCopy["0-0"]).length).toEqual(2);
    const txs = (await storage.export()).txs;
    storage.load({ txs: txs, addressCache: {} });
    expect(storage.primaryIndex).toMatchObject(primaryIndexCopy);
    expect(storage.accountIndex).toMatchObject(accountIndexCopy);
  }, 30000);
});
