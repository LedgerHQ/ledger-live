import { cardApi, cardApiExtra } from "./api";
import { cardService } from "./service";
import type { CardApiExtra } from "./types";

const common = { ledgerClientVersion: "test" };
const own: CardApiExtra = {
  getCardApiBaseUrl: () => "https://card.test",
  getCardBaanxClientKey: () => "client-key",
  isCardUsEnv: () => false,
  readCardSession: async () => ({ token: null, sessionId: 0 }),
  isCardSessionCurrent: () => true,
  refreshCardSession: async () => ({ kind: "session-ended" }),
};

describe("cardService", () => {
  it("registers the Card api", () => {
    expect(cardService(() => own).api).toBe(cardApi);
  });

  it("builds the same extraArgument as cardApiExtra", () => {
    expect(cardService(() => own).buildExtra(common)).toEqual(cardApiExtra(own));
  });
});
