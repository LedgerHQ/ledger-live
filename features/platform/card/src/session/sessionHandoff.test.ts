import {
  forgetCardAuthorizationGrant,
  forgetReceivedCardSessions,
  putCardAuthorizationGrant,
  receiveCardSession,
  takeCardAuthorizationGrant,
  takeCardSession,
} from "./sessionHandoff";

const session = { accessToken: "at_token", refreshToken: "rt_token" };
const grant = { code: "auth-code", codeVerifier: "pkce-verifier" };

beforeEach(() => {
  forgetReceivedCardSessions();
  forgetCardAuthorizationGrant();
});

describe("the authorization grant slot", () => {
  it("hands the grant over once", () => {
    putCardAuthorizationGrant(grant);

    expect(takeCardAuthorizationGrant()).toEqual(grant);
    // The first exchange uses the grant. A second read must not answer with it again.
    expect(takeCardAuthorizationGrant()).toBeNull();
  });

  it("answers nothing when the caller put none there", () => {
    expect(takeCardAuthorizationGrant()).toBeNull();
  });

  it("forgets a grant whose exchange never ran", () => {
    putCardAuthorizationGrant(grant);

    forgetCardAuthorizationGrant();

    expect(takeCardAuthorizationGrant()).toBeNull();
  });
});

describe("the session hand-off", () => {
  it("gives back the session the handle names, once", () => {
    const handle = receiveCardSession(session);

    expect(takeCardSession(handle)).toEqual(session);
    expect(takeCardSession(handle)).toBeNull();
  });

  it("never hands a caller the session a later grant put here", () => {
    const first = receiveCardSession(session);
    const second = receiveCardSession({ accessToken: "at_2", refreshToken: "rt_2" });

    // The two can belong to different users, so a stale handle answers nothing rather than the
    // wrong session. One slot, so the later grant is the one that stands.
    expect(takeCardSession(first)).toBeNull();
    expect(takeCardSession(second)).toEqual({ accessToken: "at_2", refreshToken: "rt_2" });
  });

  it("answers nothing for a handle it never issued", () => {
    expect(takeCardSession("card-session-nobody-issued")).toBeNull();
  });

  it("holds one session, so a dropped receipt cannot pile up", () => {
    const dropped = receiveCardSession(session);
    const latest = receiveCardSession({ accessToken: "at_2", refreshToken: "rt_2" });

    // An unread session is a credential nobody can spend. The next grant overwrites it.
    expect(takeCardSession(dropped)).toBeNull();
    expect(takeCardSession(latest)).not.toBeNull();
  });

  it("drops everything when the session ends", () => {
    const handle = receiveCardSession(session);

    forgetReceivedCardSessions();

    expect(takeCardSession(handle)).toBeNull();
  });
});
