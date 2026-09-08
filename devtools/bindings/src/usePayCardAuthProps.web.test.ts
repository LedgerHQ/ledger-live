import { usePayCardAuthProps } from "./usePayCardAuthProps.web";

describe("usePayCardAuthProps (web)", () => {
  it("should report no session, because the web host stores none", () => {
    const auth = usePayCardAuthProps();

    expect(auth).toMatchObject({
      session: null,
      sessionError: null,
      busy: false,
      lastResult: null,
      mock: { available: false, response: "pass", responses: [], renewals: 0 },
    });
  });

  it("should answer every action, so the panel needs no web branch of its own", () => {
    const auth = usePayCardAuthProps();

    expect(() => {
      auth.readTokens();
      auth.renewNow();
      auth.breakAccessToken();
      auth.breakRefreshToken();
      auth.clearSession();
      auth.fetchUser();
      auth.mock.setResponse("400");
      auth.mock.resetRenewals();
      auth.mock.armUnauthorized();
    }).not.toThrow();
  });

  it("should hand the host's Pay tab action through", () => {
    const openPayTab = jest.fn();

    expect(usePayCardAuthProps({ openPayTab }).openPayTab).toBe(openPayTab);
  });
});
