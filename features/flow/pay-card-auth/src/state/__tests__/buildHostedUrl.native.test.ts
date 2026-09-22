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

  it.each([
    "https://attacker.test/onboarding/signup",
    "//attacker.test/onboarding/signup",
    "https://provider.test.attacker.test/onboarding/signup",
    "http://provider.test/onboarding/signup",
  ])("refuses the path %p, which leaves the base origin", path => {
    expect(() => buildHostedUrl("https://provider.test", path)).toThrow(/must stay on/);
  });

  it("takes a path that names the base origin in full", () => {
    expect(buildHostedUrl("https://provider.test", "https://provider.test/kyc")).toBe(
      "https://provider.test/kyc",
    );
  });
});
