import { server } from "@tests/server";
import {
  clearPayCardTransactionsMock,
  emptyPayCardTransactionsMock,
  receivePayCardTransactionMock,
} from "@domain/api-card-management/mock/card-transactions";
import {
  clearPayCardWalletsMock,
  emptyPayCardWalletsMock,
  setPayCardReorderMockEnabled,
} from "@domain/api-card-management/mock/card-wallets";
import { MOCK_CARD_ACCESS_TOKEN } from "@domain/api-card-management/mock/card-session";
import handlers from "./handler";

const API_URL = "https://card.test";
const MOCK_SESSION_HEADERS = { authorization: `Bearer ${MOCK_CARD_ACCESS_TOKEN}` };

async function getJson(path: string, headers?: HeadersInit) {
  const response = await fetch(`${API_URL}${path}`, { headers });
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
    setPayCardReorderMockEnabled(false);
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
      setPayCardReorderMockEnabled(true);
    });

    afterEach(() => {
      jest.useFakeTimers();
    });

    it("should keep an amount on every linked asset when the reorder toggle is enabled", async () => {
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

  it("should paginate a devtool transaction history", async () => {
    emptyPayCardTransactionsMock();
    for (let index = 0; index < 11; index += 1) {
      receivePayCardTransactionMock("usdc");
    }

    const firstPage = await getJson("/v1/card/transactions?page=0");
    const secondPage = await getJson("/v1/card/transactions?page=1");
    const exhaustedPage = await getJson("/v1/card/transactions?page=2");

    expect(firstPage).toHaveLength(10);
    expect(secondPage).toHaveLength(1);
    expect(exhaustedPage).toEqual([]);
    expect(new Set([...firstPage, ...secondPage].map(({ id }) => id)).size).toBe(11);
  });

  it("should serve the default transaction fixture to a mock session", async () => {
    const transactions = await getJson("/v1/card/transactions", MOCK_SESSION_HEADERS);

    expect(transactions.length).toBeGreaterThan(1);
  });

  it("should reject reorder writes when its mock is disabled", async () => {
    const response = await fetch(`${API_URL}/v1/wallet/internal/card_linked/priority`, {
      method: "PUT",
      headers: { ...MOCK_SESSION_HEADERS, "content-type": "application/json" },
      body: JSON.stringify({ wallets: [] }),
    });

    expect(response.status).toBe(501);
  });

  it("should reject a malformed charging order", async () => {
    jest.useRealTimers();
    setPayCardReorderMockEnabled(true);

    const response = await fetch(`${API_URL}/v1/wallet/internal/card_linked/priority`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "{",
    });

    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toEqual({ success: false });
    jest.useFakeTimers();
  });
});
