import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { makeLRUCacheWithTtlOf, calculateFees } from "./cache";
import getFeesForTransaction from "./getFeesForTransaction";
import type { Transaction } from "./types";
import { TEST_CONFIG, TEST_LOGGER } from "./__tests__/fixtures/coinConfig";

jest.mock("./getFeesForTransaction", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("makeLRUCacheWithTtlOf", () => {
  const makeCache = () => {
    const f = jest.fn(async (ttl: number, key: string) => `${key}@${ttl}`);
    const cache = makeLRUCacheWithTtlOf(
      f,
      (_ttl, key) => key,
      ttl => ttl,
    );
    return { f, cache };
  };

  it("serves the cached value for the same key and TTL", async () => {
    const { f, cache } = makeCache();

    await cache(60_000, "a");
    expect(await cache(60_000, "a")).toBe("a@60000");

    expect(f).toHaveBeenCalledTimes(1);
  });

  it("applies a changed TTL on the next call", async () => {
    const { f, cache } = makeCache();

    await cache(60_000, "a");
    await cache(10, "a");

    expect(f).toHaveBeenCalledTimes(2);
  });

  it("resets the caches of every TTL", async () => {
    const { f, cache } = makeCache();
    await cache(60_000, "a");
    await cache(30_000, "a");

    cache.reset();
    await cache(60_000, "a");
    await cache(30_000, "a");

    expect(f).toHaveBeenCalledTimes(4);
  });
});

describe("calculateFees", () => {
  const mockedGetFees = jest.mocked(getFeesForTransaction);
  const account = { id: "js:2:bitcoin:xpub:native_segwit", blockHeight: 1 } as Account;
  const transaction = {
    amount: new BigNumber(1000),
    useAllAmount: false,
    recipient: "bc1qrecipient",
    feePerByte: new BigNumber(2),
    utxoStrategy: { strategy: 0, excludeUTXOs: [] },
    rbf: true,
  } as unknown as Transaction;
  const fees = { fees: new BigNumber(1), txInputs: [], txOutputs: [] };

  beforeEach(() => {
    calculateFees.reset();
    mockedGetFees.mockReset();
    mockedGetFees.mockResolvedValue(fees);
  });

  it("serves the cached estimate while the config is unchanged", async () => {
    await calculateFees(TEST_CONFIG, TEST_LOGGER, { account, transaction });
    await calculateFees(TEST_CONFIG, TEST_LOGGER, { account, transaction });

    expect(mockedGetFees).toHaveBeenCalledTimes(1);
  });

  it("recomputes when the explorer changes with an unchanged TTL", async () => {
    await calculateFees(TEST_CONFIG, TEST_LOGGER, { account, transaction });
    await calculateFees(
      { ...TEST_CONFIG, explorer: { url: "https://other.test.invalid" } },
      TEST_LOGGER,
      { account, transaction },
    );
    await calculateFees({ ...TEST_CONFIG, explorerId: "btc2" }, TEST_LOGGER, {
      account,
      transaction,
    });

    expect(mockedGetFees).toHaveBeenCalledTimes(3);
  });

  it("recomputes when only the explorer batch size changes with an unchanged TTL", async () => {
    await calculateFees(TEST_CONFIG, TEST_LOGGER, { account, transaction });
    await calculateFees(
      { ...TEST_CONFIG, explorer: { ...TEST_CONFIG.explorer, batchSize: 50 } },
      TEST_LOGGER,
      { account, transaction },
    );

    expect(mockedGetFees).toHaveBeenCalledTimes(2);
  });

  it("recomputes when the RBF bump changes with an unchanged TTL", async () => {
    await calculateFees(TEST_CONFIG, TEST_LOGGER, { account, transaction });
    await calculateFees({ ...TEST_CONFIG, fees: { rbfMinBumpRatio: 0.5 } }, TEST_LOGGER, {
      account,
      transaction,
    });

    expect(mockedGetFees).toHaveBeenCalledTimes(2);
  });
});
