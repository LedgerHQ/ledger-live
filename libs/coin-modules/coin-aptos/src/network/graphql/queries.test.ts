import { GetAccountTransactionsData, GetAccountTransactionsDataGt } from "./queries";

describe("account transactions queries", () => {
  // Offset pagination is only consistent across pages with an explicit, unique ordering.
  it.each([
    ["GetAccountTransactionsData", GetAccountTransactionsData],
    ["GetAccountTransactionsDataGt", GetAccountTransactionsDataGt],
  ])("%s orders by ascending transaction version", (_, query) => {
    expect(query).toMatch(/order_by:\s*\{\s*transaction_version:\s*asc\s*\}/);
  });
});
