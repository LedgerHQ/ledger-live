import { setupServer } from "msw/node";
import {
  clearCardOnboardingStatusMock,
  setCardOnboardingStatusMock,
} from "@domain/api-card-management/mock/card-onboarding-status";
import { MOCK_CARD_ACCESS_TOKEN_PREFIX } from "@domain/api-card-management/mock/card-session";
import handlers from "./handler";

const STATUS_URL = "https://card.test/v1/card/status";
const MOCK_SESSION = { authorization: `Bearer ${MOCK_CARD_ACCESS_TOKEN_PREFIX}1` };

const server = setupServer(...handlers);

function getStatus() {
  return fetch(STATUS_URL, { headers: MOCK_SESSION });
}

describe("card mock handler: GET /v1/card/status", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    clearCardOnboardingStatusMock();
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it("answers 404 while the card is mocked as not ordered", async () => {
    setCardOnboardingStatusMock("hasCard", false);

    const response = await getStatus();

    expect(response.status).toBe(404);
  });

  it("answers 404 even once the wallet step is mocked, since there is no card to carry", async () => {
    setCardOnboardingStatusMock("hasCard", false);
    setCardOnboardingStatusMock("cardAddedToDigitalWallet", true);

    const response = await getStatus();

    expect(response.status).toBe(404);
  });

  it("leaves the wallet flag out while only the card is mocked", async () => {
    setCardOnboardingStatusMock("hasCard", true);

    const response = await getStatus();

    expect(response.status).toBe(200);
    // Absent, not false: that is how the app reads a tenant which does not answer for the flag.
    expect(await response.json()).not.toHaveProperty("cardAddedToDigitalWallet");
  });

  it.each([true, false])(
    "serves the wallet answer %s on its own, without the card being mocked",
    async cardAddedToDigitalWallet => {
      setCardOnboardingStatusMock("cardAddedToDigitalWallet", cardAddedToDigitalWallet);

      const response = await getStatus();

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ cardAddedToDigitalWallet });
    },
  );

  it("serves the wallet answer alongside a mocked card", async () => {
    setCardOnboardingStatusMock("hasCard", true);
    setCardOnboardingStatusMock("cardAddedToDigitalWallet", true);

    const response = await getStatus();

    expect(await response.json()).toMatchObject({
      status: "ACTIVE",
      cardAddedToDigitalWallet: true,
    });
  });

  it("answers a mock session with the static card while nothing is mocked", async () => {
    const response = await getStatus();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ panLast4: "1234" });
  });
});
