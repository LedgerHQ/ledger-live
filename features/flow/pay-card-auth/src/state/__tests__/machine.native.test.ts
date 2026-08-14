import { createActor, waitFor, type Actor } from "xstate";
import { cardLoginMachine } from "../machine";
import type { CardLoginOauthConfig, CardLoginPorts, PayCardAuthCallback } from "../types";

const oauthConfig: CardLoginOauthConfig = {
  clientId: "client-key",
  redirectUri: "ledgerlive://paytab",
};

const attempt = { state: "state-value", codeVerifier: "verifier-value" };
const callback: PayCardAuthCallback = { code: "auth-code", state: "state-value" };

const session = {
  accessToken: "at_token",
  expiresIn: 21600,
  refreshToken: "rt_token",
  refreshTokenExpiresIn: 15897600,
};

const user = { id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301", verificationState: "VERIFIED" } as const;

type Ports = { [K in keyof CardLoginPorts]: jest.Mock };

/** A store that answers "nothing stored" and an API that answers the happy path. */
function stubPorts(overrides: Partial<Ports> = {}): Ports {
  return {
    createAttempt: jest.fn(async () => ({ ...attempt, codeChallenge: "challenge-value" })),
    saveAttempt: jest.fn(async () => undefined),
    loadAttempt: jest.fn(async () => null),
    clearAttempt: jest.fn(async () => undefined),
    hasSession: jest.fn(async () => false),
    persistSession: jest.fn(async () => undefined),
    clearSession: jest.fn(async () => undefined),
    initiateAuthorize: jest.fn(async () => ({ url: "https://card.test/login" })),
    exchangeAuthorizationCode: jest.fn(async () => session),
    getUser: jest.fn(async () => user),
    openHostedLogin: jest.fn(async () => ({
      type: "success",
      url: "ledgerlive://paytab?code=auth-code&state=state-value",
    })),
    ...overrides,
  };
}

function start(ports: Ports, initialCallback: PayCardAuthCallback | null = null) {
  const actor = createActor(cardLoginMachine, {
    input: { ports: ports as unknown as CardLoginPorts, oauthConfig, callback: initialCallback },
  });
  actor.start();
  return actor;
}

type CardLoginActor = Actor<typeof cardLoginMachine>;

function settledAt(actor: CardLoginActor, value: string) {
  return waitFor(actor, snapshot => snapshot.value === value, { timeout: 1000 });
}

describe("cardLoginMachine cold start", () => {
  it("offers the login action when nothing is stored", async () => {
    const actor = start(stubPorts());

    await settledAt(actor, "idle");
    expect(actor.getSnapshot().value).toBe("idle");
  });

  it("fetches the user when a session is already stored", async () => {
    const ports = stubPorts({ hasSession: jest.fn(async () => true) });

    const actor = start(ports);

    await settledAt(actor, "ready");
    expect(ports.getUser).toHaveBeenCalledTimes(1);
  });

  it("wipes a leftover attempt before it carries on signed in", async () => {
    const ports = stubPorts({
      hasSession: jest.fn(async () => true),
      loadAttempt: jest.fn(async () => attempt),
    });

    const actor = start(ports);

    await settledAt(actor, "ready");
    expect(ports.clearAttempt).toHaveBeenCalledTimes(1);
    expect(ports.clearSession).not.toHaveBeenCalled();
  });

  it("wipes a stale attempt and offers the login action again", async () => {
    const ports = stubPorts({ loadAttempt: jest.fn(async () => attempt) });

    const actor = start(ports);

    await settledAt(actor, "idle");
    expect(ports.clearAttempt).toHaveBeenCalledTimes(1);
  });

  it("completes a redirect the app already held", async () => {
    const ports = stubPorts({ loadAttempt: jest.fn(async () => attempt) });

    const actor = start(ports, callback);

    await settledAt(actor, "ready");
    expect(ports.exchangeAuthorizationCode).toHaveBeenCalledWith({
      code: "auth-code",
      redirectUri: "ledgerlive://paytab",
      codeVerifier: "verifier-value",
    });
    expect(ports.openHostedLogin).not.toHaveBeenCalled();
  });

  it("reports a redirect that has no attempt behind it", async () => {
    const actor = start(stubPorts(), callback);

    await settledAt(actor, "error");
    expect(actor.getSnapshot().context.errorKind).toBe("missing_attempt");
  });

  it("offers the login action when the store cannot be read", async () => {
    const ports = stubPorts({
      loadAttempt: jest.fn(async () => {
        throw new Error("keychain unavailable");
      }),
    });

    const actor = start(ports);

    await settledAt(actor, "idle");
    expect(actor.getSnapshot().value).toBe("idle");
  });
});

describe("cardLoginMachine login", () => {
  it("carries one attempt from the PKCE mint to the stored session", async () => {
    const ports = stubPorts({ loadAttempt: jest.fn(async () => attempt) });
    const actor = start(ports);
    await settledAt(actor, "idle");

    actor.send({ type: "LOGIN" });

    await settledAt(actor, "ready");
    expect(ports.saveAttempt).toHaveBeenCalledWith(attempt);
    expect(ports.initiateAuthorize).toHaveBeenCalledWith({
      clientId: "client-key",
      redirectUri: "ledgerlive://paytab",
      state: "state-value",
      codeChallenge: "challenge-value",
    });
    expect(ports.openHostedLogin).toHaveBeenCalledWith(
      "https://card.test/login",
      "ledgerlive://paytab",
    );
    expect(ports.persistSession).toHaveBeenCalledWith(session);
    // The attempt is wiped once the session is on disk.
    expect(ports.clearAttempt).toHaveBeenCalled();
  });

  it("accepts the deep link when it arrives before the browser answers", async () => {
    const ports = stubPorts({
      loadAttempt: jest.fn(async () => attempt),
      openHostedLogin: jest.fn(() => new Promise(() => undefined)),
    });
    const actor = start(ports);
    await settledAt(actor, "idle");
    actor.send({ type: "LOGIN" });
    await waitFor(actor, snapshot => snapshot.value === "awaitingHostedLogin");

    actor.send({ type: "CALLBACK_RECEIVED", ...callback });

    await settledAt(actor, "ready");
    expect(ports.exchangeAuthorizationCode).toHaveBeenCalledTimes(1);
  });

  it("ignores a second redirect for the same attempt", async () => {
    const ports = stubPorts({ loadAttempt: jest.fn(async () => attempt) });
    const actor = start(ports);
    await settledAt(actor, "idle");
    actor.send({ type: "LOGIN" });
    await settledAt(actor, "ready");

    actor.send({ type: "CALLBACK_RECEIVED", code: "another-code", state: "state-value" });

    expect(actor.getSnapshot().value).toBe("ready");
    expect(ports.exchangeAuthorizationCode).toHaveBeenCalledTimes(1);
  });

  it("goes back to the login action without a message when the browser is dismissed", async () => {
    const ports = stubPorts({
      loadAttempt: jest.fn(async () => attempt),
      openHostedLogin: jest.fn(async () => ({ type: "dismissed" })),
    });
    const actor = start(ports);
    await settledAt(actor, "idle");

    actor.send({ type: "LOGIN" });

    await settledAt(actor, "idle");
    expect(actor.getSnapshot().context.errorKind).toBeNull();
    expect(ports.clearAttempt).toHaveBeenCalled();
  });

  it("treats a redirect without a code as a dismissal", async () => {
    const ports = stubPorts({
      loadAttempt: jest.fn(async () => attempt),
      openHostedLogin: jest.fn(async () => ({ type: "success", url: "ledgerlive://paytab" })),
    });
    const actor = start(ports);
    await settledAt(actor, "idle");

    actor.send({ type: "LOGIN" });

    await settledAt(actor, "idle");
    expect(actor.getSnapshot().context.errorKind).toBeNull();
  });

  it("starts a new attempt when the user retries", async () => {
    const ports = stubPorts({
      loadAttempt: jest.fn(async () => attempt),
      openHostedLogin: jest.fn(async () => {
        throw new Error("no browser");
      }),
    });
    const actor = start(ports);
    await settledAt(actor, "idle");
    actor.send({ type: "LOGIN" });
    await settledAt(actor, "error");

    actor.send({ type: "RETRY" });

    await waitFor(actor, snapshot => snapshot.context.errorKind === null);
    expect(ports.createAttempt).toHaveBeenCalledTimes(2);
  });
});

describe("cardLoginMachine failures", () => {
  it.each([
    ["pkce_failed", { saveAttempt: jest.fn(async () => Promise.reject(new Error("no store"))) }],
    [
      "initiate_failed",
      { initiateAuthorize: jest.fn(async () => Promise.reject(new Error("500"))) },
    ],
    [
      "browser_open_failed",
      { openHostedLogin: jest.fn(async () => Promise.reject(new Error("x"))) },
    ],
    [
      "exchange_failed",
      { exchangeAuthorizationCode: jest.fn(async () => Promise.reject(new Error("400"))) },
    ],
    [
      "persist_failed",
      { persistSession: jest.fn(async () => Promise.reject(new Error("no disk"))) },
    ],
  ])("reports %s", async (errorKind, overrides) => {
    const ports = stubPorts({ loadAttempt: jest.fn(async () => attempt), ...overrides });
    const actor = start(ports);
    await settledAt(actor, "idle");

    actor.send({ type: "LOGIN" });

    await settledAt(actor, "error");
    expect(actor.getSnapshot().context.errorKind).toBe(errorKind);
  });

  it("reports a redirect whose state does not match the attempt", async () => {
    const ports = stubPorts({
      loadAttempt: jest.fn(async () => ({ ...attempt, state: "another-state" })),
    });

    const actor = start(ports, callback);

    await settledAt(actor, "error");
    expect(actor.getSnapshot().context.errorKind).toBe("state_mismatch");
    expect(ports.exchangeAuthorizationCode).not.toHaveBeenCalled();
  });

  it("ends the session when the user endpoint answers 401", async () => {
    const ports = stubPorts({
      hasSession: jest.fn(async () => true),
      getUser: jest.fn(async () => Promise.reject({ status: 401 })),
    });

    const actor = start(ports);

    await settledAt(actor, "idle");
    expect(ports.clearSession).toHaveBeenCalledTimes(1);
    expect(actor.getSnapshot().context.errorKind).toBeNull();
  });

  it("keeps the session when the user endpoint cannot be reached", async () => {
    const ports = stubPorts({
      hasSession: jest.fn(async () => true),
      getUser: jest.fn(async () => Promise.reject({ status: "FETCH_ERROR" })),
    });

    const actor = start(ports);

    await settledAt(actor, "error");
    expect(actor.getSnapshot().context.errorKind).toBe("fetch_user_failed");
    expect(ports.clearSession).not.toHaveBeenCalled();
  });
});
