import { ZodError } from "zod";
import { defineApiServices } from "../../compose";
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

  it("fails at createExtra when a getter is missing", () => {
    const { getCardApiBaseUrl: _missing, ...incomplete } = own;
    // @ts-expect-error: getCardApiBaseUrl is required
    const services = defineApiServices([cardService(() => incomplete)]);

    expect(() => services.createExtra(common)).toThrow(ZodError);
  });
});
