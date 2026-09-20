import { server } from "@tests/server";
import {
  clearPayCardTransactionsMock,
  emptyPayCardTransactionsMock,
  receivePayCardTransactionMock,
} from "@domain/api-card-management/mock/card-transactions";
import {
  clearPayCardWalletsMock,
  emptyPayCardWalletsMock,
} from "@domain/api-card-management/mock/card-wallets";
import handlers from "./handler";

const API_URL = "https://card.test";

async function getJson(path: string) {
  const response = await fetch(`${API_URL}${path}`);
  expect(response.ok).toBe(true);
  return response.json();
}

describe("mobile Card mock handlers", () => {
  beforeEach(() => {
    clearPayCardTransactionsMock();
    clearPayCardWalletsMock();
    server.use(...handlers);
  });

  afterEach(() => {
    clearPayCardTransactionsMock();
    clearPayCardWalletsMock();
  });

  it("should serve empty wallet balances when the devtool empties them", async () => {
    emptyPayCardWalletsMock();

    const internal = await getJson("/v1/wallet/internal");
    const linked = await getJson("/v1/wallet/internal/card_linked");

    expect(internal).toHaveLength(3);
    expect(internal.every(({ balance }: { balance: string }) => balance === "0.00")).toBe(true);
    expect(linked).toHaveLength(3);
  });

  it("should serve only the received asset when the devtool builds transaction history", async () => {
    emptyPayCardTransactionsMock();
    receivePayCardTransactionMock("btc");

    const transactions = await getJson("/v1/card/transactions");

    expect(transactions).toHaveLength(1);
    expect(transactions[0].fundingSources).toEqual([expect.objectContaining({ currency: "btc" })]);
  });
});
