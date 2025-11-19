// Mock the config module
jest.mock("../config", () => ({
  getCoinConfig: () => ({
    status: {
      type: "active",
    },
    infra: {
      API_MINA_ROSETTA_NODE: "https://mina.coin.ledger.com/node",
      API_MINA_GRAPHQL_NODE: "https://mina.coin.ledger.com/node/graphql",
      API_VALIDATORS_BASE_URL: "https://mina.coin.ledger.com/node/validators",
    },
  }),
  setCoinConfig: jest.fn(),
}));

import { getAccount, getTransactions } from "../api";

const invalidAddress = [
  "B62qkdFWJSW8zaTBZjTVtmeU3rVxyUkNxPhKKW8T2JBtpj5XfdywLJM",
  "novalidaddress",
];
const validAddress = ["B62qkdFWJSW8zaTBZjTVtmeU3rVxyUkNxPhKKW8T2JBtpj5XfdywLSM"];

test("get balance for an account", async () => {
  for (const address of invalidAddress) {
    await expect(getAccount(address)).toBeDefined();
  }

  for (const address of validAddress) {
    const account = await getAccount(address);
    expect(account).toBeDefined();
    expect(account.balance.toNumber()).toBeGreaterThan(0);
  }
});

test(
  "get transaction",
  async () => {
    for (const address of invalidAddress) {
      const transactions = await getTransactions(address);
      expect(transactions).toBeDefined();
      expect(transactions).toHaveLength(0);
    }

    for (const address of validAddress) {
      const transactions = await getTransactions(address);
      expect(transactions).toBeDefined();
      expect(transactions.length).toBeGreaterThan(0);
    }
  },
  60 * 1000,
);
