import { server } from "@tests/server";
import {
  clearPayCardTransactionsMock,
  emptyPayCardTransactionsMock,
  receivePayCardTransactionMock,
} from "@domain/api-card-management/mock/card-transactions";
import {
  clearPayCardWalletsMock,
  emptyPayCardWalletsMock,
  fillPayCardWalletsMock,
} from "@domain/api-card-management/mock/card-wallets";
import handlers from "./handler";

const API_URL = "https://card.test";

async function getJson(path: string) {
  const response = await fetch(`${API_URL}${path}`);
  expect(response.ok).toBe(true);
  return response.json();
}

async function putJson(path: string, body: unknown) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  expect(response.ok).toBe(true);
  return response.json();
}

type MockWallet = { id: string; balance: string; currency: string };

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

  // The reorder answer is held open by a timer, and the suite runs on fake ones by default, so
  // these wait on the clock the handler itself waits on.
  describe("the rewritten charging order", () => {
    beforeEach(() => {
      jest.useRealTimers();
      fillPayCardWalletsMock();
    });

    afterEach(() => {
      jest.useFakeTimers();
    });

    it("should keep an amount on every linked asset after the charging order is rewritten", async () => {
      const linked: MockWallet[] = await getJson("/v1/wallet/internal/card_linked");

      const { success } = await putJson("/v1/wallet/internal/card_linked/priority", {
        wallets: [...linked].reverse().map(({ id }, index) => ({ addressId: id, priority: index })),
      });
      expect(success).toBe(true);

      // The reorder is what the balance screen refetches on, so read both answers back the way it
      // joins them: a linked wallet with no balance of its own renders a ticker and no amount.
      const reordered: MockWallet[] = await getJson("/v1/wallet/internal/card_linked");
      const balances: MockWallet[] = await getJson("/v1/wallet/internal");
      const balanceById = new Map(balances.map(({ id, balance }) => [id, balance]));

      expect(reordered.map(({ currency }) => currency)).toEqual(
        [...linked].reverse().map(({ currency }) => currency),
      );
      expect(reordered).toHaveLength(3);
      expect(reordered.every(({ id }) => Number(balanceById.get(id)) > 0)).toBe(true);
    });

    it("should hold the reorder answer open long enough for the row to show its spinner", async () => {
      const linked: MockWallet[] = await getJson("/v1/wallet/internal/card_linked");
      const startedAt = Date.now();

      await putJson("/v1/wallet/internal/card_linked/priority", {
        wallets: linked.map(({ id }, index) => ({ addressId: id, priority: index })),
      });

      // Timer resolution, not the delay, is what the margin is for.
      expect(Date.now() - startedAt).toBeGreaterThanOrEqual(150);
    });
  });

  it("should serve only the received asset when the devtool builds transaction history", async () => {
    emptyPayCardTransactionsMock();
    receivePayCardTransactionMock("btc");

    const transactions = await getJson("/v1/card/transactions");

    expect(transactions).toHaveLength(1);
    expect(transactions[0].fundingSources).toEqual([expect.objectContaining({ currency: "btc" })]);
  });
});
