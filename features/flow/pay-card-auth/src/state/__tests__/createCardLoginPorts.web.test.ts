import { cardManagementApi } from "@domain/api-card-management";
import {
  getCardSessionToken,
  putCardAuthorizationGrant,
  takeCardAuthorizationGrant,
  takeCardSession,
} from "@features/platform-card";
import { createCardLoginPorts, type CardLoginDispatch } from "../createCardLoginPorts";
import type { OpenHostedLogin } from "../types";

jest.mock("@features/platform-card", () => ({
  cardSession: { set: jest.fn(async () => undefined), clear: jest.fn(async () => undefined) },
  getCardSessionToken: jest.fn(async () => "at_token"),
  putCardAuthorizationGrant: jest.fn(),
  forgetCardAuthorizationGrant: jest.fn(),
  takeCardAuthorizationGrant: jest.fn(() => null),
  takeCardSession: jest.fn(() => null),
}));

const grant = { code: "a-code", codeVerifier: "a-verifier" };
const session = { accessToken: "at_token", refreshToken: "rt_token" };
const receipt = { sessionHandle: "card-session-1" };

// Never called here: these tests only cover the session and exchange ports.
const openHostedLogin: OpenHostedLogin = jest.fn(
  async (_loginUrl: string, _deepLink?: string) => ({ type: "dismissed" }) as const,
);

function buildPorts(unwrap: () => Promise<unknown> = async () => receipt) {
  const dispatch = jest.fn(() => ({ unwrap, unsubscribe: () => undefined }));
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
    jest.mocked(takeCardSession).mockReturnValue(session);
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
    it("passes the grant out of band and reads the session back by its handle", async () => {
      const initiate = jest.spyOn(
        cardManagementApi.endpoints.exchangeAuthorizationCode,
        "initiate",
      );
      const { ports } = buildPorts();

      await expect(ports.exchangeAuthorizationCode(grant)).resolves.toEqual(session);

      expect(putCardAuthorizationGrant).toHaveBeenCalledWith(grant);
      // No argument, and no tracked answer: nothing about this login enters redux.
      expect(initiate).toHaveBeenCalledWith(undefined, { track: false });
      expect(takeCardSession).toHaveBeenCalledWith("card-session-1");
      initiate.mockRestore();
    });

    it("fails when the hand-off holds no session for the handle", async () => {
      jest.mocked(takeCardSession).mockReturnValue(null);
      const { ports } = buildPorts();

      await expect(ports.exchangeAuthorizationCode(grant)).rejects.toThrow(
        "The login session is no longer available",
      );
    });

    it("forgets a grant whose exchange failed, so no later call can spend it", async () => {
      const { ports } = buildPorts(async () => {
        throw new Error("the provider refused the grant");
      });

      await expect(ports.exchangeAuthorizationCode(grant)).rejects.toThrow(
        "the provider refused the grant",
      );
      expect(takeCardAuthorizationGrant).not.toHaveBeenCalled();
      expect(
        jest.requireMock("@features/platform-card").forgetCardAuthorizationGrant,
      ).toHaveBeenCalled();
    });
  });
});
