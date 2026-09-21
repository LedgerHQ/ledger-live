import { setupServer } from "msw/node";
import { MOCK_CARD_ACCESS_TOKEN } from "@domain/api-card-management/mock/card-session";
import {
  clearPayCardWalletsMock,
  fillPayCardWalletsMock,
  setPayCardReorderMockEnabled,
} from "@domain/api-card-management/mock/card-wallets";
import handlers from "./handler";

const API_URL = "https://card.test";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("desktop Card mock handlers", () => {
  beforeEach(() => {
    clearPayCardWalletsMock();
    setPayCardReorderMockEnabled(false);
  });

  it("should serve the devtool wallet balances and linked wallets", async () => {
    fillPayCardWalletsMock();

    const internal = await fetch(`${API_URL}/v1/wallet/internal`);
    const linked = await fetch(`${API_URL}/v1/wallet/internal/card_linked`);

    expect(internal.ok).toBe(true);
    await expect(internal.json()).resolves.toHaveLength(3);
    expect(linked.ok).toBe(true);
    await expect(linked.json()).resolves.toHaveLength(3);
  });

  it("should apply a mocked charging order", async () => {
    setPayCardReorderMockEnabled(true);
    const linked = (await (await fetch(`${API_URL}/v1/wallet/internal/card_linked`)).json()) as {
      id: string;
    }[];

    const response = await fetch(`${API_URL}/v1/wallet/internal/card_linked/priority`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        wallets: linked.map(({ id }, priority) => ({ addressId: id, priority })),
      }),
    });

    expect(response.ok).toBe(true);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("should reject charging-order writes for a mock session when reorder is disabled", async () => {
    const response = await fetch(`${API_URL}/v1/wallet/internal/card_linked/priority`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${MOCK_CARD_ACCESS_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ wallets: [] }),
    });

    expect(response.status).toBe(501);
  });
});
