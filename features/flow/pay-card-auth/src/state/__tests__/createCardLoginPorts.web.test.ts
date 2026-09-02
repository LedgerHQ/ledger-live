import { cardManagementApi } from "@domain/api-card-management";
import { cardSession, getCardSessionToken } from "@features/platform-card";
import { createCardLoginPorts, type CardLoginDispatch } from "../createCardLoginPorts";
import type { OpenHostedLogin } from "../types";

jest.mock("@features/platform-card", () => ({
  cardSession: {
    set: jest.fn(async () => undefined),
    clear: jest.fn(async () => undefined),
  },
  getCardSessionToken: jest.fn(async () => "at_token"),
}));

const grant = { code: "a-code", codeVerifier: "a-verifier" };
const session = { accessToken: "at_token", expiresIn: 3600, refreshToken: "rt_token" };

// Never called here: these tests only cover the session and exchange ports.
const openHostedLogin: OpenHostedLogin = jest.fn(
  async (_loginUrl: string, _deepLink?: string) => ({ type: "dismissed" }) as const,
);

function buildPorts(answer: () => Promise<unknown> = async () => session) {
  // `initiate` answers with a promise that also carries `unwrap`, and the port awaits `unwrap()`.
  // `resetApiState` is a plain action, so the fake serves both by carrying the field.
  const dispatch = jest.fn(() => ({ unwrap: answer }));
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
    it("dispatches the grant untracked and answers with the session", async () => {
      const initiate = jest.spyOn(
        cardManagementApi.endpoints.exchangeAuthorizationCode,
        "initiate",
      );
      const { ports, dispatch } = buildPorts();

      await expect(ports.exchangeAuthorizationCode(grant)).resolves.toEqual(session);

      // `track: false`, so the session never becomes a cache entry the DevTools state carries.
      expect(initiate).toHaveBeenCalledWith(grant, { track: false });
      expect(dispatch).toHaveBeenCalledTimes(1);
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

  describe("persistSession", () => {
    it("clears the previous Card cache after the replacement session is stored", async () => {
      let finishWrite!: () => void;
      jest.mocked(cardSession.set).mockReturnValue(
        new Promise(resolve => {
          finishWrite = resolve;
        }),
      );
      const { ports, dispatch } = buildPorts();

      const persisted = ports.persistSession(session);
      expect(dispatch).not.toHaveBeenCalled();

      finishWrite();
      await persisted;

      expect(dispatch).toHaveBeenCalledWith(cardManagementApi.util.resetApiState());
    });
  });
});
