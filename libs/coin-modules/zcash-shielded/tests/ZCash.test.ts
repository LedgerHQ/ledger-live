import ZCash from "../src/ZCash";

describe("estimateSyncTime", () => {
  test("estimates the sync time", async () => {
    const zcash = new ZCash();
    const estimatedSyncTime = await zcash.estimateSyncTime(5, 10);
    expect(estimatedSyncTime).toEqual(25);
  });
});

describe("findBlockHeight", () => {
  test("finds the lowest block height", async () => {
    const zcash = new ZCash();
    const height = await zcash.findBlockHeight(1234);
    expect(height).toEqual(1276);
  });
});

describe("decryptTransaction", () => {
  test("decrypts an encrypted transaction", async () => {
    const zcash = new ZCash();
    const height = await zcash.decryptTransaction("transaction");
    expect(height).toEqual("decrypted_transaction");
  });
});
