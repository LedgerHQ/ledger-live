import { buildHostedPageUrl } from "../buildHostedPageUrl";

const SIGNUP_URL = "https://hosted.test/onboarding/signup";
const AUTHORIZE_URL = "https://card.api.test/v1/auth/oauth2/authorize?client_id=key&prompt=consent";

describe("buildHostedPageUrl", () => {
  it("keeps the path of the page, and takes the base of the host", () => {
    expect(buildHostedPageUrl("https://provider.test", SIGNUP_URL)).toBe(
      "https://provider.test/onboarding/signup",
    );
  });

  it("keeps the query of the page", () => {
    expect(buildHostedPageUrl("https://provider.test", AUTHORIZE_URL)).toBe(
      "https://provider.test/v1/auth/oauth2/authorize?client_id=key&prompt=consent",
    );
  });

  it("takes the base of a host that carries a path of its own", () => {
    expect(
      buildHostedPageUrl("https://provider.test/v1/auth/oauth2/authorize", AUTHORIZE_URL),
    ).toBe("https://provider.test/v1/auth/oauth2/authorize?client_id=key&prompt=consent");
  });

  it("refuses a base that is not https", () => {
    expect(() => buildHostedPageUrl("http://provider.test", SIGNUP_URL)).toThrow(/must be https/);
  });

  it("refuses a page that is not a URL", () => {
    expect(() => buildHostedPageUrl("https://provider.test", "/onboarding/signup")).toThrow(
      /Invalid URL/,
    );
  });
});
