import { getEnvDefault, setEnv } from "@shared/env";
import { cardSession } from "@features/platform-card";
import { setSignedIn } from "@features/flow-pay-card-auth/state";
import logger from "~/renderer/logger";
import { bootstrapCardSession, parseSession } from "./bootstrapCardSession";

const valid = {
  accessToken: "real-access-token",
  refreshToken: "no-refresh-token-from-password-login",
  expiresIn: 3600,
};

const validJson = JSON.stringify(valid);

describe("parseSession", () => {
  it("should accept a well-formed session", () => {
    expect(parseSession(JSON.stringify(valid))).toEqual(valid);
  });

  it("should still accept a token that merely contains a sentinel word", () => {
    expect(
      parseSession(JSON.stringify({ ...valid, accessToken: "null-ish-but-real-token" })),
    ).toMatchObject({
      accessToken: "null-ish-but-real-token",
    });
  });

  it.each(["null", "undefined", "NULL", " null ", "none", "0", "false", "nil"])(
    "should reject the accessToken string sentinel %p rather than sending it as a Bearer token",
    token => {
      expect(() => parseSession(JSON.stringify({ ...valid, accessToken: token }))).toThrow(
        "accessToken must have a non-empty, non-sentinel value",
      );
    },
  );

  it.each(["null", "undefined", "NULL", " null ", "none", "0", "false", "nil"])(
    "should reject the refreshToken string sentinel %p",
    token => {
      expect(() => parseSession(JSON.stringify({ ...valid, refreshToken: token }))).toThrow(
        "refreshToken must have a non-empty, non-sentinel value",
      );
    },
  );

  it('should reject a JSON null accessToken rather than coercing it to the string "null"', () => {
    expect(() => parseSession(JSON.stringify({ ...valid, accessToken: null }))).toThrow(
      "accessToken must be a string",
    );
  });
});

describe("bootstrapCardSession", () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    setEnv("PLAYWRIGHT_RUN", false);
    setEnv("CARD_SESSION_BOOTSTRAP", "");
    jest.spyOn(logger, "log");
    jest.spyOn(logger, "error");
  });

  afterEach(async () => {
    await cardSession.clear();
    setEnv("PLAYWRIGHT_RUN", getEnvDefault("PLAYWRIGHT_RUN"));
    setEnv("CARD_SESSION_BOOTSTRAP", getEnvDefault("CARD_SESSION_BOOTSTRAP"));
  });

  it("should ignore CARD_SESSION_BOOTSTRAP when the production-like gate is closed", async () => {
    setEnv("CARD_SESSION_BOOTSTRAP", validJson);

    await bootstrapCardSession(dispatch);

    await expect(cardSession.get()).resolves.toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
    expect(logger.log).not.toHaveBeenCalled();
  });

  it("should do nothing when PLAYWRIGHT_RUN is on but CARD_SESSION_BOOTSTRAP is empty", async () => {
    setEnv("PLAYWRIGHT_RUN", true);

    await bootstrapCardSession(dispatch);

    await expect(cardSession.get()).resolves.toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should install the session and mark signed-in when PLAYWRIGHT_RUN carries a valid payload", async () => {
    setEnv("PLAYWRIGHT_RUN", true);
    setEnv("CARD_SESSION_BOOTSTRAP", validJson);

    await bootstrapCardSession(dispatch);

    await expect(cardSession.get()).resolves.toEqual({
      accessToken: valid.accessToken,
      refreshToken: valid.refreshToken,
    });
    expect(dispatch).toHaveBeenCalledWith(setSignedIn(true));
    expect(logger.log).toHaveBeenCalledWith(
      "Card session bootstrapped from CARD_SESSION_BOOTSTRAP",
    );
    expect(logger.log).not.toHaveBeenCalledWith(expect.stringContaining(valid.accessToken));
  });

  it("should log the parse failure and stay signed-out when the payload is not JSON", async () => {
    setEnv("PLAYWRIGHT_RUN", true);
    setEnv("CARD_SESSION_BOOTSTRAP", "bare-token-must-not-appear-in-logs");

    await bootstrapCardSession(dispatch);

    await expect(cardSession.get()).resolves.toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "CARD_SESSION_BOOTSTRAP could not be applied: value is not valid JSON",
    );
    expect(logger.error).not.toHaveBeenCalledWith(expect.stringContaining("bare-token"));
  });

  it("should log unknown error when installing the session rejects with a non-Error", async () => {
    setEnv("PLAYWRIGHT_RUN", true);
    setEnv("CARD_SESSION_BOOTSTRAP", validJson);
    jest.spyOn(cardSession, "set").mockRejectedValue("storage down");

    await bootstrapCardSession(dispatch);

    expect(dispatch).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "CARD_SESSION_BOOTSTRAP could not be applied: unknown error",
    );
  });
});
