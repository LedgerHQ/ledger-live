import {
  makeNetworkStatusResponse,
  makeAccountBalanceResponse,
  makeBlockInfoResponse,
  makeTransactionsResponse,
  makeRosettaTransaction,
} from "../../test/helpers/msw-fixtures";
import { server, rosettaHandlers } from "../../test/helpers/msw-rosetta.mock";
import { getBlockInfo } from "../history/getBlockInfo";
import { getTransactions } from "../history/getTransactions";
import { getAccount } from "./getAccount";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const VALID_ADDRESS = "B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD";

describe("getAccount via MSW", () => {
  it("should return balance for a valid address", async () => {
    server.use(
      ...rosettaHandlers({
        "/network/status": () =>
          makeNetworkStatusResponse({ current_block_identifier: { index: 400000, hash: "h" } }),
        "/account/balance": () => makeAccountBalanceResponse({ totalBalance: 2_000_000_000 }),
      }),
    );

    const account = await getAccount(VALID_ADDRESS);
    expect(account.balance.toNumber()).toBe(2_000_000_000);
    expect(account.blockHeight).toBe(400000);
  });

  it("should return zero balance for an invalid/unknown address", async () => {
    server.use(
      ...rosettaHandlers({
        "/network/status": () => makeNetworkStatusResponse(),
        "/account/balance": () => {
          throw new Error("Account not found");
        },
      }),
    );

    const account = await getAccount("novalidaddress");
    expect(account.balance.toNumber()).toBe(0);
    expect(account.spendableBalance.toNumber()).toBe(0);
  });
});

describe("getBlockInfo via MSW", () => {
  it("should return block info for a given height", async () => {
    server.use(
      ...rosettaHandlers({
        "/block": body => {
          const { block_identifier } = body as { block_identifier: { index: number } };
          return makeBlockInfoResponse(block_identifier.index);
        },
      }),
    );

    const blockInfo = await getBlockInfo(1);
    expect(blockInfo.block.block_identifier.index).toBe(1);
  });
});

describe("getTransactions via MSW", () => {
  it("should return empty array for address with no transactions", async () => {
    server.use(
      ...rosettaHandlers({
        "/search/transactions": () => makeTransactionsResponse([]),
      }),
    );

    const transactions = await getTransactions("novalidaddress");
    expect(transactions).toHaveLength(0);
  });

  it("should return transactions sorted by timestamp descending", async () => {
    const txn1 = makeRosettaTransaction({ hash: "old-txn", timestamp: 1700000000000 });
    const txn2 = makeRosettaTransaction({ hash: "new-txn", timestamp: 1700002000000 });

    server.use(
      ...rosettaHandlers({
        "/search/transactions": () => makeTransactionsResponse([txn1, txn2]),
      }),
    );

    const transactions = await getTransactions(VALID_ADDRESS);
    expect(transactions).toHaveLength(2);
    expect(transactions[0].transaction.transaction_identifier.hash).toBe("new-txn");
    expect(transactions[1].transaction.transaction_identifier.hash).toBe("old-txn");
  });
});
