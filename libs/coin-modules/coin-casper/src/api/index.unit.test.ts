import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import { fetchAccountStateInfo, fetchBalance, fetchNetworkStatus, fetchTxs } from ".";

const pubkey = "0202664e3958608cd8dc2b80d4c73f18f76ef197f1cccca2f4f817c70bb050b248bd";
const pubkeyAbandon = getAbandonSeedAddress("casper");

describe("Casper API", () => {
  it("should be able to fetch the network status", async () => {
    const status = await fetchNetworkStatus();
    expect(status).toBeDefined();
  });

  it("shouldn't fetch account state info if account doesn't exist", async () => {
    const accountStateInfo = await fetchAccountStateInfo(pubkeyAbandon);
    expect(accountStateInfo).toEqual({
      purseUref: undefined,
      accountHash: undefined,
    });
  });

  it("should fetch account state info if account exists", async () => {
    const accountStateInfo = await fetchAccountStateInfo(pubkey);
    expect(accountStateInfo.purseUref).toBeDefined();
    expect(accountStateInfo.accountHash).toBeDefined();
  });

  it("should fetch balance", async () => {
    const accountStateInfo = await fetchAccountStateInfo(pubkey);

    expect(accountStateInfo.purseUref).toBeDefined();
    if (!accountStateInfo.purseUref) {
      throw new Error("Purse Uref is undefined");
    }

    const balance = await fetchBalance(accountStateInfo.purseUref);
    expect(balance).toBeDefined();
  });

  it("should fetch txs", async () => {
    const txs = await fetchTxs(pubkey);

    expect(txs).toBeDefined();
    expect(txs.length).toBeGreaterThan(0);
  });

  it("should fetch txs for abandon seed address", async () => {
    const txs = await fetchTxs(pubkeyAbandon);
    expect(txs).toBeDefined();
    expect(txs.length).toBe(0);
  });
});
