import { buildSignupUrl } from "../buildSignupUrl";
import type { CardLoginOauthConfig } from "../types";

const oauthConfig: CardLoginOauthConfig = {
  apiUrl: "https://dev.api.baanx.com",
  clientId: "dc16bbda-eb1b-487c-be60-1a90ca7c9dd6",
  hostedUiUrl: "https://ledger-ew1uat.baanxapi.com",
  redirectUri: "https://go.ledger.com/ledger/card-baanx",
  deepLink: "ledgerlive://paytab",
};

describe("buildSignupUrl", () => {
  it("addresses the signup page of the provider's hosted UI", () => {
    expect(buildSignupUrl(oauthConfig)).toBe(
      "https://ledger-ew1uat.baanxapi.com/onboarding/signup",
    );
  });

  it("keeps the signup page on the hosted UI when the base carries a path", () => {
    const { origin, pathname } = new URL(
      buildSignupUrl({ ...oauthConfig, hostedUiUrl: "https://hosted.test/tenant" }),
    );

    expect(origin).toBe("https://hosted.test");
    expect(pathname).toBe("/onboarding/signup");
  });

  it("refuses a hosted UI that is not https", () => {
    expect(() => buildSignupUrl({ ...oauthConfig, hostedUiUrl: "http://hosted.test" })).toThrow(
      /must be https/,
    );
  });
});
