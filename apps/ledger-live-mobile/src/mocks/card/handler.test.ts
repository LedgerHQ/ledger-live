import { setupServer } from "msw/node";
import {
  clearCardOnboardingStatusMock,
  setCardOnboardingStatusMock,
} from "@domain/api-card-management/mock/card-onboarding-status";
import handlers from "./handler";

const server = setupServer(...handlers);

const API = "https://card.test";
const MOCK_TOKEN = { authorization: "Bearer at_mock_1" };
const REAL_TOKEN = { authorization: "Bearer at_real_token" };

async function get(path: string, headers: Record<string, string>) {
  const response = await fetch(`${API}${path}`, { headers });
  return { status: response.status, body: await response.json() };
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  clearCardOnboardingStatusMock();
  server.resetHandlers();
});
afterAll(() => server.close());

describe("the answers the card onboarding screen sets", () => {
  it("verifies the account, or leaves it pending", async () => {
    setCardOnboardingStatusMock("accountVerified", true);
    expect((await get("/v1/user", REAL_TOKEN)).body).toMatchObject({
      verificationState: "VERIFIED",
    });

    setCardOnboardingStatusMock("accountVerified", false);
    expect((await get("/v1/user", REAL_TOKEN)).body).not.toMatchObject({
      verificationState: "VERIFIED",
    });
  });

  it("answers with a card, or with none at all", async () => {
    setCardOnboardingStatusMock("hasCard", true);
    const answered = await get("/v1/card/status", REAL_TOKEN);
    expect(answered.status).toBe(200);
    expect(answered.body).toMatchObject({ status: "ACTIVE" });

    setCardOnboardingStatusMock("hasCard", false);
    // Absent, not empty: the step reads whether a card was answered with at all.
    expect((await get("/v1/card/status", REAL_TOKEN)).status).toBe(404);
  });

  it("funds the linked wallets, or empties them", async () => {
    setCardOnboardingStatusMock("walletFunded", true);
    const funded = (await get("/v1/wallet/internal", REAL_TOKEN)).body as { balance: string }[];
    expect(funded.every(({ balance }) => Number(balance) > 0)).toBe(true);

    setCardOnboardingStatusMock("walletFunded", false);
    const empty = (await get("/v1/wallet/internal", REAL_TOKEN)).body as { balance: string }[];
    // Emptied, not dropped: an unfunded card still has its wallets.
    expect(empty).toHaveLength(funded.length);
    expect(empty.every(({ balance }) => Number(balance) === 0)).toBe(true);
  });

  it("links every wallet the balances belong to, so the join finds them all", async () => {
    setCardOnboardingStatusMock("walletFunded", true);

    const internal = (await get("/v1/wallet/internal", REAL_TOKEN)).body as { id: string }[];
    const linked = (await get("/v1/wallet/internal/card_linked", REAL_TOKEN)).body as {
      id: string;
    }[];

    expect(internal.map(({ id }) => id)).toEqual(linked.map(({ id }) => id));
    expect(linked).toHaveLength(3);
  });

  it("answers on three chains, so the join has rows that price differently", async () => {
    setCardOnboardingStatusMock("walletFunded", true);

    const linked = (await get("/v1/wallet/internal/card_linked", REAL_TOKEN)).body as {
      currency: string;
      network: string;
    }[];

    expect(linked.map(({ currency, network }) => `${currency}.${network}`)).toEqual([
      "usdc.ethereum",
      "btc.bitcoin",
      "sol.solana",
    ]);
  });
});

describe("a session the provider never issued", () => {
  it("answers the wallets locally, rather than sending a mock token to the provider", async () => {
    const internal = await get("/v1/wallet/internal", MOCK_TOKEN);
    const linked = await get("/v1/wallet/internal/card_linked", MOCK_TOKEN);

    expect(internal.status).toBe(200);
    expect(linked.status).toBe(200);
    // Unfunded, so the top-up step reads as not done until it is toggled.
    expect(Number((internal.body as { balance: string }[])[0]?.balance)).toBe(0);
  });

  it("still lets an answer win, so a step can be set while mocking a session", async () => {
    setCardOnboardingStatusMock("walletFunded", true);

    const internal = await get("/v1/wallet/internal", MOCK_TOKEN);

    expect(Number((internal.body as { balance: string }[])[0]?.balance)).toBeGreaterThan(0);
  });

  it("answers the account and the card from the app's own mock, as it did before", async () => {
    expect((await get("/v1/user", MOCK_TOKEN)).body).toMatchObject({
      verificationState: "VERIFIED",
    });
    expect((await get("/v1/card/status", MOCK_TOKEN)).body).toMatchObject({ status: "ACTIVE" });
  });
});
