import BigNumber from "bignumber.js";
import { casperMainnetResolvedConfig } from "../__tests__/fixtures/config.fixture";
import { fetchAccountStateInfo, fetchBalance, fetchLastBlock, fetchTxs, fetchTxsPage } from "./api";
import { BUSY_MAINNET_PUBLIC_KEY } from "../__tests__/fixtures/addresses.fixture";
import { CASPER_DUMMY_ADDRESS } from "../constants";

const pubkey = "0202664e3958608cd8dc2b80d4c73f18f76ef197f1cccca2f4f817c70bb050b248bd";
const pubkeyAbandon = CASPER_DUMMY_ADDRESS;
const config = casperMainnetResolvedConfig;

describe("Casper API", () => {
  it("should be able to fetch the network status", async () => {
    const { height } = await fetchLastBlock(config);
    expect(height).toBeGreaterThan(0);
  });

  it("shouldnt fetch account state info if account doesnt exist", async () => {
    const accountStateInfo = await fetchAccountStateInfo(config, pubkeyAbandon);
    expect(accountStateInfo).toEqual({
      purseUref: undefined,
      accountHash: undefined,
    });
  });

  it("should fetch account state info if account exists", async () => {
    const accountStateInfo = await fetchAccountStateInfo(config, pubkey);
    expect(accountStateInfo.purseUref).toMatch(/^uref/);
    expect(accountStateInfo.accountHash).toEqual(expect.any(String));
  });

  it("should fetch balance", async () => {
    const accountStateInfo = await fetchAccountStateInfo(config, pubkey);

    expect(accountStateInfo.purseUref).toMatch(/^uref/);
    if (!accountStateInfo.purseUref) {
      throw new Error("Purse Uref is undefined");
    }

    const balance = await fetchBalance(config, accountStateInfo.purseUref);
    expect(balance).toBeInstanceOf(BigNumber);
  });

  it("should fetch txs", async () => {
    const txs = await fetchTxs(config, pubkey);

    expect(txs).toBeInstanceOf(Array);
    expect(txs.length).toBeGreaterThan(0);
  });

  it("should fetch txs for abandon seed address", async () => {
    const txs = await fetchTxs(config, pubkeyAbandon);
    expect(txs).toBeInstanceOf(Array);
    expect(txs.length).toBe(0);
  });

  // `listOperations` stops walking once a whole page falls below `minHeight`, which is only sound
  // while the feed is newest-first. The indexer accepts its documented `order_by` /
  // `order_direction` params but ignores them, so the order cannot be requested — only observed.
  // If this fails, the indexer changed its ordering and that early exit is no longer safe.
  it("serves the deploy feed newest-first, which listOperations' early exit depends on", async () => {
    const { data } = await fetchTxsPage(config, BUSY_MAINNET_PUBLIC_KEY, 1);

    expect(data.length).toBeGreaterThan(1);
    const timestamps = data.map(tx => Date.parse(tx.timestamp));
    expect([...timestamps].sort((a, b) => b - a)).toEqual(timestamps);
  });
});
