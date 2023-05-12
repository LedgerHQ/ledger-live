import BitcoinLikeStorage from "../storage";

describe("Unit tests for bitcoin storage", () => {
  let storage: BitcoinLikeStorage;
  beforeEach(() => {
    storage = new BitcoinLikeStorage();
    // init with 2 confirmed txs and 1 unconfirmed tx in bitcoin storage
    storage.appendTxs([
      {
        id: "9e1b337875c21f751e70ee2c2c6ee93d8a6733d0f3ba6d139ae6a0479ebcefb0",
        inputs: [],
        outputs: [
          {
            output_index: 0,
            value: "5000000000",
            address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
            output_hash:
              "9e1b337875c21f751e70ee2c2c6ee93d8a6733d0f3ba6d139ae6a0479ebcefb0",
            block_height: 1,
            rbf: false,
          },
          {
            output_index: 1,
            value: "0",
            address: "<unknown>",
            output_hash:
              "9e1b337875c21f751e70ee2c2c6ee93d8a6733d0f3ba6d139ae6a0479ebcefb0",
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
            output_hash:
              "2772f3963856f3eb38cb706ec8c2b62fcdeb2ce10f32cf7160afb3873be6f60d",
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
            output_hash:
              "0b9f98d07eb418fa20573112d3cba6b871d429a06c724a7888ff0886be5213d1",
            block_height: 120,
            rbf: false,
          },
          {
            output_index: 1,
            value: "4699983200",
            address: "2MynSTpze5SDcuLr1DekSV7RVrFpQCo3LeP",
            output_hash:
              "0b9f98d07eb418fa20573112d3cba6b871d429a06c724a7888ff0886be5213d1",
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
      {
        id: "446a5364d109a01bb079ae3ce95577c25ac7169ef2e29ce82578ba4739fb5a36",
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
        outputs: [
          {
            output_index: 0,
            value: "300000000",
            address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
            output_hash:
              "446a5364d109a01bb079ae3ce95577c25ac7169ef2e29ce82578ba4739fb5a36",
            block_height: 120,
            rbf: false,
          },
          {
            output_index: 1,
            value: "4699983200",
            address: "2MynSTpze5SDcuLr1DekSV7RVrFpQCo3LeP",
            output_hash:
              "446a5364d109a01bb079ae3ce95577c25ac7169ef2e29ce82578ba4739fb5a36",
            block_height: 120,
            rbf: false,
          },
        ],
        block: null,
        account: 0,
        index: 0,
        address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
        received_at: "2021-07-28T13:34:38Z",
      },
    ]);
  });
  it("testing add transaction data and remove transaction data", async () => {
    // 1 pending txs and 2 confirmed txs
    expect(storage.txsSize()).toBe(3);
    storage.appendTxs([
      {
        id: "9e1b337875c21f751e70ee2c2c6ee93d8a6733d0f3ba6d139ae6a0479ebcefb0",
        inputs: [],
        outputs: [],
        block: null,
        account: 0,
        index: 0,
        address: "mwXTtHo8Yy3aNKUUZLkBDrTcKT9qG9TqLb",
        received_at: "2021-07-28T13:34:17Z",
      },
    ]);
    // same tx id, should not be added
    expect(storage.txsSize()).toBe(3);
    // remove pending tx
    storage.removePendingTxs({ account: 0, index: 0 });
    expect(storage.txsSize()).toBe(2);
    // remove all txs
    storage.removeTxs({ account: 0, index: 0 });
    expect(storage.txsSize()).toBe(0);
  }, 30000);

  it("testing fetch transaction data from bitcoin storage", async () => {
    // 1 pending txs and 2 confirmed txs
    expect(storage.getHighestBlockHeightAndHash()?.height).toEqual(120);
    expect(storage.getHighestBlockHeightAndHash()?.hash).toEqual(
      "305d4b8d4a6d6ecca0a3dd0216f8ecd090978ed346d1845883c8aa4529d72fc8"
    );

    expect(storage.hasPendingTx({ account: 0, index: 0 })).toBe(true);
    expect(storage.hasTx({ account: 0, index: 0 })).toBe(true);
    expect(storage.getLastUnconfirmedTx()).toBeDefined();
    // remove pending tx
    storage.removePendingTxs({ account: 0, index: 0 });
    expect(storage.hasPendingTx({ account: 0, index: 0 })).toBe(false);
    expect(storage.hasTx({ account: 0, index: 0 })).toBe(true);
    expect(
      storage.getLastConfirmedTxBlock({ account: 0, index: 0 })?.height
    ).toEqual(120);
    expect(
      storage.getLastConfirmedTxBlock({ account: 0, index: 0 })?.hash
    ).toEqual(
      "305d4b8d4a6d6ecca0a3dd0216f8ecd090978ed346d1845883c8aa4529d72fc8"
    );

    expect(storage.getLastUnconfirmedTx()).toBeUndefined();
    // remove all tx
    storage.removeTxs({ account: 0, index: 0 });
    expect(
      storage.getLastConfirmedTxBlock({ account: 0, index: 0 })
    ).toBeNull();
    expect(storage.hasPendingTx({ account: 0, index: 0 })).toBe(false);
    expect(storage.hasTx({ account: 0, index: 0 })).toBe(false);
    expect(storage.getHighestBlockHeightAndHash()).toBeNull();
  }, 30000);
});
