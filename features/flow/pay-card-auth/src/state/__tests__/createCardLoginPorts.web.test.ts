import { cardManagementApi } from "@domain/api-card-management";
import { getCardSessionToken } from "@features/platform-card";
import { createCardLoginPorts, type CardLoginDispatch } from "../createCardLoginPorts";
import type { OpenHostedLogin } from "../types";

jest.mock("@features/platform-card", () => ({
  cardSession: { set: jest.fn(async () => undefined), clear: jest.fn(async () => undefined) },
  getCardSessionToken: jest.fn(async () => "at_token"),
}));

const session = { accessToken: "at_token", expiresIn: 3600, refreshToken: "rt_token" };

// Never called here: these tests only cover the session and exchange ports.
const openHostedLogin: OpenHostedLogin = jest.fn(
  async (_loginUrl: string, _deepLink?: string) => ({ type: "dismissed" }) as const,
);

function buildPorts() {
  const dispatch = jest.fn(() => ({
    unwrap: async () => session,
    unsubscribe: () => undefined,
  }));
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const ports = createCardLoginPorts({
    dispatch: dispatch as unknown as CardLoginDispatch,
    openHostedLogin,
  });
  return { ports, dispatch };
}

describe("createCardLoginPorts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getCardSessionToken).mockResolvedValue("at_token");
  });

  describe("hasSession", () => {
    it("reports a session from the stored token", async () => {
      const { ports } = buildPorts();

      await expect(ports.hasSession()).resolves.toBe(true);
      expect(getCardSessionToken).toHaveBeenCalledTimes(1);
    });

    it("reports no session when nothing is stored", async () => {
      jest.mocked(getCardSessionToken).mockResolvedValue(null);
      const { ports } = buildPorts();

      await expect(ports.hasSession()).resolves.toBe(false);
    });
  });

  describe("exchangeAuthorizationCode", () => {
    it("does not park the session it receives in the store", async () => {
      const initiate = jest.spyOn(
        cardManagementApi.endpoints.exchangeAuthorizationCode,
        "initiate",
      );
      const { ports } = buildPorts();

      await expect(
        ports.exchangeAuthorizationCode({ code: "a-code", codeVerifier: "a-verifier" }),
      ).resolves.toEqual(session);

      expect(initiate).toHaveBeenCalledWith(
        { code: "a-code", codeVerifier: "a-verifier" },
        { track: false },
      );
      initiate.mockRestore();
    });
  });
});
