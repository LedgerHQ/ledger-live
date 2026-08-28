import { createActor, waitFor, type Actor } from "xstate";
import { cardLoginMachine } from "../machine";
import type { CardLoginOauthConfig, CardLoginPorts, PayCardAuthCallback } from "../types";

// Two different values on purpose: the provider gets the `https` redirect, and the browser session
// ends on the app's deep link. A test that spelled them the same could not catch a swap.
const oauthConfig: CardLoginOauthConfig = {
  apiUrl: "https://card.test",
  clientId: "client-key",
  redirectUri: "https://go.test/ledger/card",
  deepLink: "ledgerlive://paytab",
};

const attempt = { codeVerifier: "verifier-value" };
const callback: PayCardAuthCallback = { code: "auth-code" };

const session = {
  accessToken: "at_token",
  expiresIn: 21600,
  refreshToken: "rt_token",
};

const user = {
  id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  verificationState: "VERIFIED",
} as const;

type Ports = { [K in keyof CardLoginPorts]: jest.Mock };

/** A store that answers "nothing stored" and an API that answers the happy path. */
function stubPorts(overrides: Partial<Ports> = {}): Ports {
  return {
    createAttempt: jest.fn(async () => ({
      ...attempt,
      codeChallenge: "challenge-value",
    })),
    saveAttempt: jest.fn(async () => undefined),
    loadAttempt: jest.fn(async () => null),
    clearAttempt: jest.fn(async () => undefined),
    hasSession: jest.fn(async () => false),
    persistSession: jest.fn(async () => undefined),
    clearSession: jest.fn(async () => undefined),
    forgetUser: jest.fn(),
    exchangeAuthorizationCode: jest.fn(async () => session),
    getUser: jest.fn(async () => user),
    setSignedIn: jest.fn(),
    openHostedLogin: jest.fn(async () => ({
      type: "success",
      url: "ledgerlive://paytab?code=auth-code&app_id=app-value",
    })),
    ...overrides,
  };
}

function start(
  ports: Ports,
  initialCallback: PayCardAuthCallback | null = null,
  config: CardLoginOauthConfig = oauthConfig,
) {
  const actor = createActor(cardLoginMachine, {
    input: {
      ports: ports as unknown as CardLoginPorts,
      oauthConfig: config,
      callback: initialCallback,
    },
  });
  actor.start();
  return actor;
}

type CardLoginActor = Actor<typeof cardLoginMachine>;

function settledAt(actor: CardLoginActor, value: string) {
  return waitFor(actor, snapshot => snapshot.value === value, {
    timeout: 1000,
  });
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

    // The authorize page is opened straight away, with the challenge in the query and no call first.
    const [loginUrl, deepLink] = ports.openHostedLogin.mock.calls[0];
    const { origin, pathname, searchParams } = new URL(loginUrl);
    expect(origin + pathname).toBe("https://card.test/v1/auth/oauth2/authorize");
    expect(Object.fromEntries(searchParams)).toEqual({
      client_id: "client-key",
      response_type: "code",
      scope: "openid profile email offline_access",
      redirect_uri: "https://go.test/ledger/card",
      code_challenge: "challenge-value",
      code_challenge_method: "S256",
      prompt: "consent",
    });
    // The provider gets the redirect URI; the browser session ends on the deep link.
    expect(deepLink).toBe("ledgerlive://paytab");
    expect(ports.persistSession).toHaveBeenCalledWith(session);
    // The attempt is wiped once the session is on disk.
    expect(ports.clearAttempt).toHaveBeenCalled();
  });

  it("reports a failure when the provider's API URL cannot build a URL", async () => {
    const ports = stubPorts();
    const actor = start(ports, null, { ...oauthConfig, apiUrl: "" });
    await settledAt(actor, "idle");

    actor.send({ type: "LOGIN" });

    // The URL is built in the actor, so a bad `apiUrl` reports a failure instead of stopping the
    // machine. The attempt reached the store before that, so it is wiped again.
    await settledAt(actor, "error");
    expect(actor.getSnapshot().context.errorKind).toBe("pkce_failed");
    expect(ports.clearAttempt).toHaveBeenCalled();
    expect(ports.openHostedLogin).not.toHaveBeenCalled();
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

    actor.send({ type: "CALLBACK_RECEIVED", code: "another-code" });

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
      openHostedLogin: jest.fn(async () => ({
        type: "success",
        url: "ledgerlive://paytab",
      })),
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
    [
      "pkce_failed",
      {
        saveAttempt: jest.fn(async () => Promise.reject(new Error("no store"))),
      },
    ],
    [
      "browser_open_failed",
      { openHostedLogin: jest.fn(async () => Promise.reject(new Error("x"))) },
    ],
    [
      "exchange_failed",
      {
        exchangeAuthorizationCode: jest.fn(async () => Promise.reject(new Error("400"))),
      },
    ],
    [
      "persist_failed",
      {
        persistSession: jest.fn(async () => Promise.reject(new Error("no disk"))),
      },
    ],
  ])("reports %s", async (errorKind, overrides) => {
    const ports = stubPorts({
      loadAttempt: jest.fn(async () => attempt),
      ...overrides,
    });
    const actor = start(ports);
    await settledAt(actor, "idle");

    actor.send({ type: "LOGIN" });

    await settledAt(actor, "error");
    expect(actor.getSnapshot().context.errorKind).toBe(errorKind);
  });

  it("reports a login that succeeded even when the attempt cannot be wiped", async () => {
    const ports = stubPorts({
      loadAttempt: jest.fn(async () => attempt),
      clearAttempt: jest.fn(async () => Promise.reject(new Error("keychain locked"))),
    });
    const actor = start(ports);
    await settledAt(actor, "idle");

    actor.send({ type: "LOGIN" });

    // The session reached the disk, so a failed wipe is hygiene, not a failed login.
    await settledAt(actor, "ready");
    expect(ports.persistSession).toHaveBeenCalledWith(session);
  });

  it("reports a redirect whose attempt is gone before the exchange", async () => {
    // Nothing is compared on this device any more. The verifier has to be there, and PKCE makes the
    // provider refuse a code that was not issued against this attempt's challenge.
    const ports = stubPorts({ loadAttempt: jest.fn(async () => null) });

    const actor = start(ports, callback);

    await settledAt(actor, "error");
    expect(actor.getSnapshot().context.errorKind).toBe("missing_attempt");
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

  it("keeps the session when a request outlived the session it was sent with", async () => {
    const ports = stubPorts({
      hasSession: jest.fn(async () => true),
      getUser: jest.fn(async () =>
        // What the base query answers for a request a newer login replaced. Not a 401: the session
        // on disk belongs to whoever just signed in.
        Promise.reject({ status: "CUSTOM_ERROR", error: "card_stale_request" }),
      ),
    });

    const actor = start(ports);

    await settledAt(actor, "error");
    expect(actor.getSnapshot().context.errorKind).toBe("fetch_user_failed");
    expect(ports.clearSession).not.toHaveBeenCalled();
  });

  it("forgets the cached user when a 401 ends the session", async () => {
    const ports = stubPorts({
      hasSession: jest.fn(async () => true),
      getUser: jest.fn(async () => Promise.reject({ status: 401 })),
    });

    const actor = start(ports);

    await settledAt(actor, "idle");
    expect(ports.forgetUser).toHaveBeenCalledTimes(1);
  });

  it("keeps the cached user when the attempt is cleared without ending the session", async () => {
    const ports = stubPorts();

    const actor = start(ports);
    await settledAt(actor, "idle");

    expect(ports.clearSession).not.toHaveBeenCalled();
    expect(ports.forgetUser).not.toHaveBeenCalled();
  });

  it("does not bounce back to authenticated after a 401 on a resumed session", async () => {
    // hydrate finds a session and a leftover attempt, so it resumes through `clearingAttempt`. If the
    // resume outlived that hop, the 401 below would return here and the two states would loop.
    const ports = stubPorts({
      hasSession: jest.fn(async () => true),
      loadAttempt: jest.fn(async () => attempt),
      getUser: jest.fn(async () => Promise.reject({ status: 401 })),
    });

    const actor = start(ports);

    await settledAt(actor, "idle");
    expect(ports.getUser).toHaveBeenCalledTimes(1);
    expect(ports.clearSession).toHaveBeenCalledTimes(1);
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

describe("cardLoginMachine signed-in flag", () => {
  async function signedIn(overrides: Partial<Ports> = {}) {
    const ports = stubPorts({
      hasSession: jest.fn(async () => true),
      ...overrides,
    });
    const actor = start(ports);
    await settledAt(actor, "ready");
    return { ports, actor };
  }

  it("publishes the signed-in flag when it reaches ready", async () => {
    const { ports } = await signedIn();

    // `CardMore` has no machine of its own, so this flag is the only thing that puts it on screen.
    expect(ports.setSignedIn).toHaveBeenLastCalledWith(true);
  });

  it("publishes the signed-out flag when it settles in idle", async () => {
    const ports = stubPorts();
    const actor = start(ports);

    await settledAt(actor, "idle");

    expect(ports.setSignedIn).toHaveBeenLastCalledWith(false);
  });

  it("publishes the signed-out flag when it settles in error", async () => {
    const ports = stubPorts({
      createAttempt: jest.fn(async () => Promise.reject(new Error("no csprng"))),
    });
    const actor = start(ports);
    await settledAt(actor, "idle");

    actor.send({ type: "LOGIN" });

    await settledAt(actor, "error");
    expect(ports.setSignedIn).toHaveBeenLastCalledWith(false);
  });

  it("puts the login back on offer when a session ends elsewhere", async () => {
    // `CardMore` owns that journey and has already ended the session, so nothing is undone here.
    const { ports, actor } = await signedIn();

    actor.send({ type: "SESSION_ENDED" });

    expect(actor.getSnapshot().value).toBe("idle");
    expect(ports.clearSession).not.toHaveBeenCalled();
    expect(ports.setSignedIn).toHaveBeenLastCalledWith(false);
  });

  it("offers a new login after a session ended elsewhere", async () => {
    const { ports, actor } = await signedIn();
    actor.send({ type: "SESSION_ENDED" });

    actor.send({ type: "LOGIN" });

    await waitFor(actor, snapshot => snapshot.value === "awaitingHostedLogin");
    expect(ports.createAttempt).toHaveBeenCalledTimes(1);
  });

  it("ignores a session end that arrives before anybody is signed in", async () => {
    const ports = stubPorts();
    const actor = start(ports);
    await settledAt(actor, "idle");

    actor.send({ type: "SESSION_ENDED" });

    expect(actor.getSnapshot().value).toBe("idle");
  });
});
