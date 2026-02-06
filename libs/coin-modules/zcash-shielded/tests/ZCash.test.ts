import ZCash from "../src/ZCash";

describe("estimatedSyncTime", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("estimates the sync time", async () => {
    jest.setSystemTime(new Date("2016-10-28T00:00:00.000Z"));
    const zcash = new ZCash();
    const estimatedSyncTime = await zcash.estimatedSyncTime(10);
    jest.setSystemTime(new Date("2016-10-28T00:20:00.000Z"));
    const estimatedSyncTimeResult = estimatedSyncTime();
    expect(estimatedSyncTimeResult).toEqual({ hours: 3, minutes: 20 });
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
