import { getAccount, getBlockInfo, getTransactions } from ".";
import { getCoinConfig } from "../config";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

jest.mock("../config");
describe("backend api tests", () => {
  jest.mocked(getCoinConfig).mockReturnValue({
    ...({} as unknown as CurrencyConfig),
    infra: {
      API_MINA_ROSETTA_NODE: "https://mina.coin.ledger.com/node",
    },
  });
  const validAddress = ["B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD"];
  const invalidAddress = [
    "B62qkdFWJSW8zaTBZjTVtmeU3rVxyUkNxPhKKW8T2JBtpj5XfdywLJM",
    "novalidaddress",
  ];

  it("getAccount for valid address", async () => {
    const account = await getAccount(validAddress[0]);
    expect(account).toBeDefined();
    expect(account.balance.toNumber()).toBeGreaterThan(0);
  });

  it("get block info", async () => {
    const blockInfo = await getBlockInfo(1);
    expect(blockInfo).toBeDefined();
    expect(blockInfo.block.block_identifier.index).toBe(1);
  });

  it("get balance should fail for invalid address", async () => {
    for (const address of invalidAddress) {
      const account = await getAccount(address);
      expect(account).toBeDefined();
      expect(account.balance.toNumber()).toBe(0);
    }
  }, 10000);

  it("get balance should succeed for valid address", async () => {
    for (const address of validAddress) {
      const account = await getAccount(address);
      expect(account).toBeDefined();
      expect(account.balance.toNumber()).toBeGreaterThan(0);
    }
  });

  it("get transactions should not fail for invalid address", async () => {
    for (const address of invalidAddress) {
      const transactions = await getTransactions(address);
      expect(transactions).toBeDefined();
      expect(transactions.length).toBe(0);
    }
  }, 30000);

  it("get transactions should succeed for valid address", async () => {
    for (const address of validAddress) {
      const transactions = await getTransactions(address);
      expect(transactions).toBeDefined();
      expect(transactions.length).toBeGreaterThan(0);
    }
  }, 30000);
});
