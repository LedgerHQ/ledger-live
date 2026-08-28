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

  it("keeps two hand-offs apart", () => {
    const first = receiveCardSession(session);
    const second = receiveCardSession({ accessToken: "at_2", refreshToken: "rt_2" });

    expect(takeCardSession(second)).toEqual({ accessToken: "at_2", refreshToken: "rt_2" });
    expect(takeCardSession(first)).toEqual(session);
  });

  it("answers nothing for a handle it never issued", () => {
    expect(takeCardSession("card-session-nobody-issued")).toBeNull();
  });

  it("bounds itself when a caller drops a receipt", () => {
    const dropped = receiveCardSession(session);
    const handles = Array.from({ length: 6 }, (_, index) =>
      receiveCardSession({ accessToken: `at_${index}`, refreshToken: `rt_${index}` }),
    );

    // An unread session is a credential nobody can spend. The oldest goes first.
    expect(takeCardSession(dropped)).toBeNull();
    expect(takeCardSession(handles[handles.length - 1])).not.toBeNull();
  });

  it("drops everything when the session ends", () => {
    const handle = receiveCardSession(session);

    forgetReceivedCardSessions();

    expect(takeCardSession(handle)).toBeNull();
  });
});
