import { exchangeAuthorizationCode } from "@domain/api-card-management";
import { getCardSessionToken } from "@features/platform-card";
import { createCardLoginPorts, type CardLoginDispatch } from "../createCardLoginPorts";
import type { OpenHostedLogin } from "../types";

jest.mock("@features/platform-card", () => ({
  cardSession: {
    set: jest.fn(async () => undefined),
    clear: jest.fn(async () => undefined),
  },
  getCardSessionToken: jest.fn(async () => "at_token"),
}));

jest.mock("@domain/api-card-management", () => ({
  ...jest.requireActual("@domain/api-card-management"),
  exchangeAuthorizationCode: jest.fn(() => "the-grant-thunk"),
}));

const grant = { code: "a-code", codeVerifier: "a-verifier" };
const session = { accessToken: "at_token", refreshToken: "rt_token" };

// Never called here: these tests only cover the session and exchange ports.
const openHostedLogin: OpenHostedLogin = jest.fn(
  async (_loginUrl: string, _deepLink?: string) => ({ type: "dismissed" }) as const,
);

function buildPorts(answer: () => Promise<unknown> = async () => session) {
  const dispatch = jest.fn(() => answer());
  const ports = createCardLoginPorts({
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
    it("dispatches the plain grant thunk and answers with the session it returns", async () => {
      const { ports, dispatch } = buildPorts();

      await expect(ports.exchangeAuthorizationCode(grant)).resolves.toEqual(session);

      // A plain thunk, so the code and the verifier never become an action's argument, and the
      // session never becomes an action's payload.
      expect(exchangeAuthorizationCode).toHaveBeenCalledWith(grant);
      expect(dispatch).toHaveBeenCalledWith("the-grant-thunk");
    });

    it("lets a refused grant travel to the login machine", async () => {
      const { ports } = buildPorts(async () => {
        throw new Error("the provider refused the grant");
      });

      await expect(ports.exchangeAuthorizationCode(grant)).rejects.toThrow(
        "the provider refused the grant",
      );
    });
  });
});
