import { cardManagementApi } from "@domain/api-card-management";
import { cardSession, getCardSessionToken } from "@features/platform-card";
import { createCardLogoutPorts } from "../createCardLogoutPorts";
import { clearAttempt } from "../attemptStore";
import { setSignedIn } from "../slice";
import type { CardLoginDispatch } from "../createCardLoginPorts";

jest.mock("@features/platform-card", () => ({
  cardSession: { clear: jest.fn(async () => undefined) },
  getCardSessionToken: jest.fn(async () => "at_token"),
}));

function buildPorts(answer: () => Promise<unknown> = async () => undefined) {
  const unwrap = jest.fn(answer);
  const dispatch = jest.fn(() => ({ unwrap }));
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const ports = createCardLogoutPorts(dispatch as unknown as CardLoginDispatch);
  return { ports, dispatch, unwrap };
}

describe("createCardLogoutPorts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getCardSessionToken).mockResolvedValue("at_token");
  });

  describe("logout", () => {
    it("should sign the cardholder out with the token the device still holds", async () => {
      const initiate = jest.spyOn(cardManagementApi.endpoints.logout, "initiate");
      const { ports, dispatch, unwrap } = buildPorts();

      await ports.logout();

      expect(getCardSessionToken).toHaveBeenCalledTimes(1);
      expect(initiate).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(unwrap).toHaveBeenCalledTimes(1);
      initiate.mockRestore();
    });

    it("should let the provider's refusal through, so the caller decides", async () => {
      const { ports } = buildPorts(async () => {
        throw new Error("the provider refused the logout");
      });

      await expect(ports.logout()).rejects.toThrow("the provider refused the logout");
    });

    it("should still ask for a logout with no token stored", async () => {
      jest.mocked(getCardSessionToken).mockResolvedValue(null);
      const { ports, dispatch } = buildPorts();

      await ports.logout();

      expect(dispatch).toHaveBeenCalledTimes(1);
    });
  });

  it("should clear the stored session", async () => {
    const { ports } = buildPorts();

    await ports.clearSession();

    expect(cardSession.clear).toHaveBeenCalledTimes(1);
  });

  it("should share the login's own attempt store, so no attempt outlives a logout", () => {
    const { ports } = buildPorts();

    expect(ports.clearAttempt).toBe(clearAttempt);
  });

  it("should forget every cached answer about the cardholder", () => {
    const { ports, dispatch } = buildPorts();

    ports.forgetUser();

    expect(dispatch).toHaveBeenCalledWith(cardManagementApi.util.resetApiState());
  });

  it.each([true, false])("should report the signed-in state as %s", isSignedIn => {
    const { ports, dispatch } = buildPorts();

    ports.setSignedIn(isSignedIn);

    expect(dispatch).toHaveBeenCalledWith(setSignedIn(isSignedIn));
  });
});
