import BigNumber from "bignumber.js";
import { casperMainnetConfig } from "../__tests__/fixtures/config.fixture";
import { getCoinConfig } from "../config";
import { fetchAccountStateInfo, fetchBalance, fetchLastBlock, fetchTxs } from "./api";
import { CASPER_DUMMY_ADDRESS } from "../constants";

const pubkey = "0202664e3958608cd8dc2b80d4c73f18f76ef197f1cccca2f4f817c70bb050b248bd";
const pubkeyAbandon = CASPER_DUMMY_ADDRESS;

jest.mock("../config");
describe("Casper API", () => {
  jest.mocked(getCoinConfig).mockReturnValue(casperMainnetConfig());

  it("should be able to fetch the network status", async () => {
    const { height } = await fetchLastBlock();
    expect(height).toBeGreaterThan(0);
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
