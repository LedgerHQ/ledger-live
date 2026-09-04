import { buildAuthorizeUrl } from "../buildAuthorizeUrl";
import type { CardLoginOauthConfig } from "../types";

const oauthConfig: CardLoginOauthConfig = {
  apiUrl: "https://dev.api.baanx.com",
  clientId: "dc16bbda-eb1b-487c-be60-1a90ca7c9dd6",
  hostedUiUrl: "https://ledger-ew1uat.baanxapi.com",
  redirectUri: "https://go.ledger.com/ledger/card-baanx",
  // Never reaches the authorize URL: the browser session ends on it, the provider never sees it.
  deepLink: "ledgerlive://paytab",
};

describe("buildAuthorizeUrl", () => {
  it("addresses the provider's authorize page", () => {
    const { origin, pathname } = new URL(buildAuthorizeUrl(oauthConfig, "challenge-value"));

    expect(origin).toBe("https://dev.api.baanx.com");
    expect(pathname).toBe("/v1/auth/oauth2/authorize");
  });

  it("carries every value the provider needs, and nothing else", () => {
    const { searchParams } = new URL(buildAuthorizeUrl(oauthConfig, "challenge-value"));

    expect(Object.fromEntries(searchParams)).toEqual({
      client_id: "dc16bbda-eb1b-487c-be60-1a90ca7c9dd6",
      response_type: "code",
      scope: "openid profile email offline_access",
      redirect_uri: "https://go.ledger.com/ledger/card-baanx",
      code_challenge: "challenge-value",
      code_challenge_method: "S256",
      prompt: "consent",
    });
  });

  it("never sends the verifier, only the challenge derived from it", () => {
    const url = buildAuthorizeUrl(oauthConfig, "challenge-value");

    expect(url).not.toContain("code_verifier");
  });

  it("encodes the redirect and the scope separators", () => {
    const url = buildAuthorizeUrl(oauthConfig, "challenge-value");

    // A raw `:` or `/` in the query would end the redirect at the provider's parser.
    expect(url).toContain("redirect_uri=https%3A%2F%2Fgo.ledger.com%2Fledger%2Fcard-baanx");
    expect(url).toContain("scope=openid+profile+email+offline_access");
  });

  it("keeps a base path on the API host", () => {
    const url = buildAuthorizeUrl({ ...oauthConfig, apiUrl: "https://card.test/" }, "challenge");

    expect(new URL(url).pathname).toBe("/v1/auth/oauth2/authorize");
  });

  it("refuses to open a non-https authorize URL", () => {
    expect(() =>
      buildAuthorizeUrl({ ...oauthConfig, apiUrl: "http://dev.api.baanx.com" }, "challenge"),
    ).toThrow();
  });
});
