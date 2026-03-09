import { CurrencyConfig } from "@ledgerhq/coin-framework/lib/config";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import BigNumber from "bignumber.js";
import { getCoinConfig } from "../config";
import { fetchAccountStateInfo, fetchBalance, fetchBlockHeight, fetchTxs } from ".";

const pubkey = "0202664e3958608cd8dc2b80d4c73f18f76ef197f1cccca2f4f817c70bb050b248bd";
const pubkeyAbandon = getAbandonSeedAddress("casper");

jest.mock("../config");
describe("Casper API", () => {
  jest.mocked(getCoinConfig).mockReturnValue({
    ...({} as unknown as CurrencyConfig),
    infra: {
      API_CASPER_NODE_ENDPOINT: "https://casper.coin.ledger.com/node/",
      API_CASPER_INDEXER: "https://casper.coin.ledger.com/indexer/",
    },
  });
  it("should be able to fetch the network status", async () => {
    const blockHeight = await fetchBlockHeight();
    expect(blockHeight).toBeGreaterThan(0);
  });

  it("shouldnt fetch account state info if account doesnt exist", async () => {
    const accountStateInfo = await fetchAccountStateInfo(pubkeyAbandon);
    expect(accountStateInfo).toEqual({
      purseUref: undefined,
      accountHash: undefined,
    });
  });

  it("should fetch account state info if account exists", async () => {
    const accountStateInfo = await fetchAccountStateInfo(pubkey);
    expect(accountStateInfo.purseUref).toMatch(/^uref/);
    expect(accountStateInfo.accountHash).toEqual(expect.any(String));
  });

  it("should fetch balance", async () => {
    const accountStateInfo = await fetchAccountStateInfo(pubkey);

    expect(accountStateInfo.purseUref).toMatch(/^uref/);
    if (!accountStateInfo.purseUref) {
      throw new Error("Purse Uref is undefined");
    }

    const balance = await fetchBalance(accountStateInfo.purseUref);
    expect(balance).toBeInstanceOf(BigNumber);
  });

  it("should fetch txs", async () => {
    const txs = await fetchTxs(pubkey);

    expect(txs).toBeInstanceOf(Array);
    expect(txs.length).toBeGreaterThan(0);
  });

  it("should fetch txs for abandon seed address", async () => {
    const txs = await fetchTxs(pubkeyAbandon);
    expect(txs).toBeInstanceOf(Array);
    expect(txs.length).toBe(0);
  });
});
