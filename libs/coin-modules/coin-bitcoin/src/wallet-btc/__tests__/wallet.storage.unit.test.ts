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
      {
        id: "446a5364d109a01bb079ae3ce95577c25ac7169ef2e29ce82578ba4739fb5a36",
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
            output_hash: "446a5364d109a01bb079ae3ce95577c25ac7169ef2e29ce82578ba4739fb5a36",
            block_height: 120,
            rbf: false,
          },
          {
            output_index: 1,
            value: "4699983200",
            address: "2MynSTpze5SDcuLr1DekSV7RVrFpQCo3LeP",
            output_hash: "446a5364d109a01bb079ae3ce95577c25ac7169ef2e29ce82578ba4739fb5a36",
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
      "305d4b8d4a6d6ecca0a3dd0216f8ecd090978ed346d1845883c8aa4529d72fc8",
    );

    expect(storage.hasPendingTx({ account: 0, index: 0 })).toBe(true);
    expect(storage.hasTx({ account: 0, index: 0 })).toBe(true);
    expect(storage.getLastUnconfirmedTx()).toBeDefined();
    // remove pending tx
    storage.removePendingTxs({ account: 0, index: 0 });
    expect(storage.hasPendingTx({ account: 0, index: 0 })).toBe(false);
    expect(storage.hasTx({ account: 0, index: 0 })).toBe(true);
    expect(storage.getLastConfirmedTxBlock({ account: 0, index: 0 })?.height).toEqual(120);
    expect(storage.getLastConfirmedTxBlock({ account: 0, index: 0 })?.hash).toEqual(
      "305d4b8d4a6d6ecca0a3dd0216f8ecd090978ed346d1845883c8aa4529d72fc8",
    );

    expect(storage.getLastUnconfirmedTx()).toBeUndefined();
    // remove all tx
    storage.removeTxs({ account: 0, index: 0 });
    expect(storage.getLastConfirmedTxBlock({ account: 0, index: 0 })).toBeNull();
    expect(storage.hasPendingTx({ account: 0, index: 0 })).toBe(false);
    expect(storage.hasTx({ account: 0, index: 0 })).toBe(false);
    expect(storage.getHighestBlockHeightAndHash()).toBeNull();
  }, 30000);

  it("should update highest block when a higher block is added", () => {
    storage.appendTxs([
      {
        id: "new-tx",
        inputs: [],
        outputs: [],
        block: {
          hash: "new-block-hash",
          height: 121,
          time: "2021-07-28T14:00:00Z",
        },
        account: 0,
        index: 0,
        address: "some-address",
        received_at: "2021-07-28T14:00:00Z",
      },
    ]);

    const highestBlock = storage.getHighestBlockHeightAndHash();
    expect(highestBlock).toEqual({
      height: 121,
      hash: "new-block-hash",
      time: "2021-07-28T14:00:00Z",
    });
  });

  it("should not change highest block if same height is added with a different hash", () => {
    const original = storage.getHighestBlockHeightAndHash();
    storage.appendTxs([
      {
        id: "another-tx",
        inputs: [],
        outputs: [],
        block: {
          hash: "different-hash",
          height: 120,
          time: "2021-07-28T14:10:00Z",
        },
        account: 0,
        index: 0,
        address: "another-address",
        received_at: "2021-07-28T14:10:00Z",
      },
    ]);
    expect(storage.getHighestBlockHeightAndHash()).toEqual(original);
  });

  it("should return null for highest block when only pending txs exist", () => {
    storage.removeTxs({ account: 0, index: 0 }); // remove all
    storage.appendTxs([
      {
        id: "pending-only",
        inputs: [],
        outputs: [],
        block: null,
        account: 0,
        index: 0,
        address: "pending-address",
        received_at: new Date().toISOString(),
      },
    ]);
    expect(storage.getHighestBlockHeightAndHash()).toBeNull();
  });

  it("should not duplicate tx if it exists as both pending and confirmed", () => {
    storage.appendTxs([
      {
        id: "duplicate-tx",
        inputs: [],
        outputs: [],
        block: null,
        account: 0,
        index: 0,
        address: "addr",
        received_at: "2021-07-28T14:30:00Z",
      },
    ]);

    // Simulate same tx confirmed later
    storage.appendTxs([
      {
        id: "duplicate-tx",
        inputs: [],
        outputs: [],
        block: {
          hash: "block-hash",
          height: 130,
          time: "2021-07-28T14:35:00Z",
        },
        account: 0,
        index: 0,
        address: "addr",
        received_at: "2021-07-28T14:35:00Z",
      },
    ]);

    expect(storage.txsSize()).toBe(4); // should only increase by 1 from the fixture (3 → 4), not 5
  });

  it("should replace earlier confirmed tx with newer version (higher block)", () => {
    const originalBlock = storage.getHighestBlockHeightAndHash();
    storage.appendTxs([
      {
        id: "replaced-tx",
        inputs: [],
        outputs: [],
        block: {
          hash: "replaced-block",
          height: 150,
          time: "2021-07-28T15:00:00Z",
        },
        account: 0,
        index: 0,
        address: "replace-address",
        received_at: "2021-07-28T15:00:00Z",
      },
    ]);

    expect(storage.getHighestBlockHeightAndHash()?.height).toBeGreaterThan(originalBlock!.height);
  });

  it("should replace a pending tx with confirmed version even if other txs remain pending", () => {
    // Step 1: Add 4 pending txs
    const baseTime = new Date("2021-07-28T16:00:00Z").toISOString();
    for (let i = 0; i < 4; i++) {
      storage.appendTxs([
        {
          id: `tx-${i}`,
          inputs: [],
          outputs: [],
          block: null,
          account: 0,
          index: 0,
          address: "addr",
          received_at: baseTime,
        },
      ]);
    }

    // Sanity: should have 4 more txs (fixture already has 3)
    expect(storage.txsSize()).toBe(7);

    // Step 2: Confirm tx-2
    storage.appendTxs([
      {
        id: "tx-2",
        inputs: [],
        outputs: [],
        block: {
          hash: "confirmed-block-hash",
          height: 200,
          time: new Date("2021-07-28T16:10:00Z").toISOString(),
        },
        account: 0,
        index: 0,
        address: "addr",
        received_at: new Date("2021-07-28T16:10:00Z").toISOString(),
      },
    ]);

    // Step 3: It should still be 7, not 8 — tx-2 should be updated, not duplicated
    expect(storage.txsSize()).toBe(7);

    // Step 4: Confirm it’s no longer pending
    const lastUnconfirmed = storage.getLastUnconfirmedTx();
    expect(lastUnconfirmed?.id).not.toBe("tx-2");

    // Step 5: Confirm tx-2 has a block now
    const tx2 = storage.exportSync().txs.find(tx => tx.id === "tx-2");
    expect(tx2?.block?.height).toBe(200);
  });

  it("should replace pending tx with confirmed tx after removePendingTxs", () => {
    // Step 1: Add a pending transaction
    const pendingTx = {
      id: "duplicate-tx",
      inputs: [],
      outputs: [],
      block: null,
      account: 0,
      index: 0,
      address: "test-address",
      received_at: "2021-07-28T15:00:00Z",
    };

    storage.appendTxs([pendingTx]);
    expect(storage.txsSize()).toBe(4); // 3 fixtures + 1 pending

    // Simulate what xpub.syncAddress does: remove pending txs first
    storage.removePendingTxs({ account: 0, index: 0 });

    // Step 2: Add a confirmed version of the same tx
    const confirmedTx = {
      ...pendingTx,
      block: {
        hash: "confirmed-block-hash",
        height: 150,
        time: "2021-07-28T15:05:00Z",
      },
      received_at: "2021-07-28T15:05:00Z",
    };

    storage.appendTxs([confirmedTx]);

    // Confirm it's replaced correctly
    const txs = storage.exportSync().txs;
    const found = txs.filter(tx => tx.id === "duplicate-tx");

    expect(found).toHaveLength(1); // Only one with that ID
    expect(found[0].block).not.toBeNull(); // It's now the confirmed version
    expect(found[0].block?.height).toBe(150);
  });
});
