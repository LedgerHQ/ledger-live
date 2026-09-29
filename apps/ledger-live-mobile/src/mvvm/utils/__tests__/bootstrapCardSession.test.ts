import Config from "react-native-config";
import { LaunchArguments } from "react-native-launch-arguments";
import { cardSession } from "@features/platform-card";
import { setSignedIn } from "@features/flow-pay-card-auth/state";
import { bootstrapCardSession, parseSession } from "../bootstrapCardSession";

jest.mock("react-native-launch-arguments", () => ({
  LaunchArguments: {
    value: jest.fn(() => ({})),
  },
}));

const valid = {
  accessToken: "real-access-token",
  refreshToken: "no-refresh-token-from-password-login",
  expiresIn: 3600,
};

const leftover = {
  accessToken: valid.accessToken,
  refreshToken: valid.refreshToken,
};

const validJson = JSON.stringify(valid);

function setLaunchPayload(payload: unknown) {
  jest
    .mocked(LaunchArguments.value)
    .mockReturnValue(payload === undefined ? {} : { CARD_SESSION_BOOTSTRAP: payload });
}

describe("parseSession", () => {
  it("should accept a well-formed session", () => {
    expect(parseSession(JSON.stringify(valid))).toEqual(valid);
  });

  it("should accept an already-parsed object, which is how Android Detox delivers launch args", () => {
    expect(parseSession(valid)).toEqual(valid);
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
  const originalDev = __DEV__;
  let detoxConfig: jest.ReplaceProperty<string | undefined>;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let cardSessionSetSpy: jest.SpyInstance | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    setLaunchPayload(undefined);
    detoxConfig = jest.replaceProperty(Config, "DETOX", undefined);
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    Object.defineProperty(global, "__DEV__", { value: originalDev, configurable: true });
    detoxConfig.restore();
    setLaunchPayload(undefined);
    delete process.env.CARD_SESSION_BOOTSTRAP;
    await cardSession.clear();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    cardSessionSetSpy?.mockRestore();
    cardSessionSetSpy = undefined;
  });

  it("should ignore CARD_SESSION_BOOTSTRAP when the production-like gate is closed", async () => {
    Object.defineProperty(global, "__DEV__", { value: false, configurable: true });
    setLaunchPayload(validJson);

    await bootstrapCardSession(dispatch);

    await expect(cardSession.get()).resolves.toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("should leave a persisted session when the production-like gate is closed", async () => {
    Object.defineProperty(global, "__DEV__", { value: false, configurable: true });
    await cardSession.set(leftover);
    setLaunchPayload(validJson);

    await bootstrapCardSession(dispatch);

    await expect(cardSession.get()).resolves.toEqual(leftover);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should drop a leftover keychain session and stay quiet when DETOX carries no payload", async () => {
    detoxConfig.replaceValue("1");
    await cardSession.set(leftover);

    await bootstrapCardSession(dispatch);

    await expect(cardSession.get()).resolves.toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("should leave an existing session when a development build has no payload, which is the Metro route", async () => {
    Object.defineProperty(global, "__DEV__", { value: true, configurable: true });
    await cardSession.set(leftover);

    await bootstrapCardSession(dispatch);

    await expect(cardSession.get()).resolves.toEqual(leftover);
    expect(dispatch).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("should install the session and mark signed-in when DETOX carries a valid payload", async () => {
    detoxConfig.replaceValue("1");
    setLaunchPayload(validJson);

    await bootstrapCardSession(dispatch);

    await expect(cardSession.get()).resolves.toEqual({
      accessToken: valid.accessToken,
      refreshToken: valid.refreshToken,
    });
    expect(dispatch).toHaveBeenCalledWith(setSignedIn(true));
    expect(console.warn).toHaveBeenCalledWith(
      "CARD_SESSION_BOOTSTRAP applied: the app is signed in with an injected session",
    );
    expect(console.warn).not.toHaveBeenCalledWith(expect.stringContaining(valid.accessToken));
  });

  it("should install the session when launch-arguments already parsed the JSON, which is the Android Detox path", async () => {
    Object.defineProperty(global, "__DEV__", { value: false, configurable: true });
    detoxConfig.replaceValue("1");
    setLaunchPayload(valid);

    await bootstrapCardSession(dispatch);

    await expect(cardSession.get()).resolves.toEqual({
      accessToken: valid.accessToken,
      refreshToken: valid.refreshToken,
    });
    expect(dispatch).toHaveBeenCalledWith(setSignedIn(true));
  });

  it("should fall back to the environment in a development build, which is the Metro route", async () => {
    Object.defineProperty(global, "__DEV__", { value: true, configurable: true });
    process.env.CARD_SESSION_BOOTSTRAP = validJson;

    await bootstrapCardSession(dispatch);

    expect(dispatch).toHaveBeenCalledWith(setSignedIn(true));
    expect(process.env.CARD_SESSION_BOOTSTRAP).toBeUndefined();
  });

  it("should never read the environment outside a development build, so a release bundle cannot carry the token", async () => {
    Object.defineProperty(global, "__DEV__", { value: false, configurable: true });
    detoxConfig.replaceValue("1");
    process.env.CARD_SESSION_BOOTSTRAP = validJson;

    await bootstrapCardSession(dispatch);

    await expect(cardSession.get()).resolves.toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should log the parse failure and stay signed-out when the payload is not JSON", async () => {
    detoxConfig.replaceValue("1");
    setLaunchPayload("bare-token-must-not-appear-in-logs");

    await bootstrapCardSession(dispatch);

    await expect(cardSession.get()).resolves.toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "CARD_SESSION_BOOTSTRAP could not be applied: value is not valid JSON",
    );
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining("bare-token"));
  });

  it("should log unknown error when installing the session rejects with a non-Error", async () => {
    detoxConfig.replaceValue("1");
    setLaunchPayload(validJson);
    cardSessionSetSpy = jest.spyOn(cardSession, "set").mockRejectedValue("storage down");

    await bootstrapCardSession(dispatch);

    expect(dispatch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "CARD_SESSION_BOOTSTRAP could not be applied: unknown error",
    );
  });
});
