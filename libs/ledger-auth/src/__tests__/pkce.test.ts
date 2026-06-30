import { createPkcePair } from "../pkce";

describe("pkce", () => {
  it("generates an S256 code challenge from the verifier", async () => {
    const pkce = await createPkcePair("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk");

    expect(pkce.codeChallengeMethod).toBe("S256");
    expect(pkce.codeVerifier).toBe("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk");
    expect(pkce.codeChallenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("generates a verifier when none is provided", async () => {
    const pkce = await createPkcePair();

    expect(pkce.codeChallengeMethod).toBe("S256");
    expect(pkce.codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(pkce.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
