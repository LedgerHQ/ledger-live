import { getAccount } from "../logic/account/getAccount";
import { getTransactions } from "../logic/history/getTransactions";
import {
  makeNetworkStatusResponse,
  makeAccountBalanceResponse,
  makeTransactionsResponse,
  makeRosettaTransaction,
} from "../test/helpers/msw-fixtures";
import { server, rosettaHandlers } from "../test/helpers/msw-rosetta.mock";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const VALID_ADDRESS = "B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD";

describe("getAccount via MSW", () => {
  it("should return balance for a valid address", async () => {
    server.use(
      ...rosettaHandlers({
        "/network/status": () => makeNetworkStatusResponse(),
        "/account/balance": () =>
          makeAccountBalanceResponse({ totalBalance: 5_000_000_000, liquidBalance: 4_500_000_000 }),
      }),
    );

    const account = await getAccount(VALID_ADDRESS);
    expect(account.balance.toNumber()).toBe(5_000_000_000);
    expect(account.spendableBalance.toNumber()).toBe(4_500_000_000);
    expect(account.blockHeight).toBe(350000);
  });

  it("should return zero balance when account/balance endpoint throws", async () => {
    server.use(
      ...rosettaHandlers({
        "/network/status": () => makeNetworkStatusResponse(),
        "/account/balance": () => {
          throw new Error("Account not found");
        },
      }),
    );

    const account = await getAccount("B62qkdFWJSW8zaTBZjTVtmeU3rVxyUkNxPhKKW8T2JBtpj5XfdywLJM");
    expect(account.balance.toNumber()).toBe(0);
    expect(account.spendableBalance.toNumber()).toBe(0);
  });
});

describe("getTransactions via MSW", () => {
  it("should return sorted transactions for a valid address", async () => {
    const txn1 = makeRosettaTransaction({ hash: "txn-1", timestamp: 1700000000000 });
    const txn2 = makeRosettaTransaction({ hash: "txn-2", timestamp: 1700001000000 });

    server.use(
      ...rosettaHandlers({
        "/search/transactions": () => makeTransactionsResponse([txn1, txn2]),
      }),
    );

    const transactions = await getTransactions(VALID_ADDRESS);
    expect(transactions).toHaveLength(2);
    expect(transactions[0].transaction.transaction_identifier.hash).toBe("txn-2");
    expect(transactions[1].transaction.transaction_identifier.hash).toBe("txn-1");
  });

  it("should return empty array when no transactions exist", async () => {
    server.use(
      ...rosettaHandlers({
        "/search/transactions": () => makeTransactionsResponse([]),
      }),
    );

    const transactions = await getTransactions(VALID_ADDRESS);
    expect(transactions).toHaveLength(0);
  });

  it("should handle paginated transaction responses", async () => {
    const txn1 = makeRosettaTransaction({ hash: "txn-page1", timestamp: 1700001000000 });
    const txn2 = makeRosettaTransaction({ hash: "txn-page2", timestamp: 1700000000000 });
    let callCount = 0;

    server.use(
      ...rosettaHandlers({
        "/search/transactions": () => {
          callCount++;
          if (callCount === 1) {
            return makeTransactionsResponse([txn1], 100);
          }
          return makeTransactionsResponse([txn2]);
        },
      }),
    );

    const transactions = await getTransactions(VALID_ADDRESS);
    expect(transactions).toHaveLength(2);
    expect(callCount).toBe(2);
  });
});
