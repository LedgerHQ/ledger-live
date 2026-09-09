import { buildHostedUrl } from "../buildHostedUrl";

describe("buildHostedUrl", () => {
  it("addresses the path on the base it was given", () => {
    expect(buildHostedUrl("https://provider.test", "/onboarding/signup")).toBe(
      "https://provider.test/onboarding/signup",
    );
  });

  it("keeps the query the path carries", () => {
    expect(buildHostedUrl("https://provider.test", "/kyc?step=2")).toBe(
      "https://provider.test/kyc?step=2",
    );
  });

  it("takes the base of a host that carries a path of its own", () => {
    expect(buildHostedUrl("https://provider.test/tenant", "/onboarding/signup")).toBe(
      "https://provider.test/onboarding/signup",
    );
  });

  it("refuses a base that is not https", () => {
    expect(() => buildHostedUrl("http://provider.test", "/onboarding/signup")).toThrow(
      /must be https/,
    );
  });

  it.each([undefined, ""])("refuses the base %p", base => {
    expect(() => buildHostedUrl(base, "/onboarding/signup")).toThrow(/no base URL/);
  });
});
