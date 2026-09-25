import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, spyOn } from "bun:test";
import { _setTestAuthRequestTimeoutMs } from "../../state-manager/configureStore";
import { MockServer, type Route } from "../../testing/mock-server";
import { runCli, storedApiAuthPubkey, useApiAuthKeychain } from "../../testing/cli-runner";
import { makeSessionDir } from "../../testing/session-fixture";
import { ETH_DESCRIPTOR } from "../../testing/constants";
import { KEYCLOAK_TOKEN, makeAuthRoutes } from "../../testing/auth-routes";
import { SWAP_QUOTE_ARGS, makeSwapQuoteRoutes } from "../../testing/swap-quote-routes";
import { makeAuthenticatedQuoteServer } from "../../testing/authenticated-quote-server";

const ACCOUNTS = [{ label: "ethereum-1", descriptor: ETH_DESCRIPTOR }];
const JSON_QUOTE_ARGS = [...SWAP_QUOTE_ARGS, "--output", "json"];

describe("quote command", () => {
  let challengeCookie: string | null = null;
  const quote = makeSwapQuoteRoutes();
  const server = new MockServer([
    ...makeAuthRoutes({
      onChallengeRequest: request => {
        challengeCookie = request.headers.get("cookie");
      },
    }),
    ...quote.routes,
  ]);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  let fixture: ReturnType<typeof makeSessionDir>;
  beforeEach(() => {
    challengeCookie = null;
    quote.quoteAuthorizations.length = 0;
    fixture = makeSessionDir(ACCOUNTS);
  });
  afterEach(() => {
    fixture.cleanup();
  });

  it("human output: prints the summary of an authenticated quote", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      [
        "swap",
        "quote",
        "--from",
        "ethereum",
        "--to",
        "bitcoin",
        "--from-account",
        "ethereum-1",
        "--to-account",
        "ethereum-1",
        "--amount",
        "0.1",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );
    expect(exitCode, `stdout: ${stdout}\nstderr: ${stderr}`).toBe(0);
    expect(stdout).toMatch(/ethereum\s*→\s*bitcoin/i);
    expect(stdout).toMatch(/ethereum/i);
    expect(stdout).toMatch(/bitcoin/i);
    expect(stdout).toMatch(/paraswap/i);
    expect(challengeCookie).toBe("AUTH_SESSION_ID=wallet-cli-test");
    expect(quote.quoteAuthorizations).toEqual([`Bearer ${KEYCLOAK_TOKEN}`]);
  });

  it("json output: returns a valid swap quote envelope", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      [
        "swap",
        "quote",
        "--from",
        "ethereum",
        "--to",
        "bitcoin",
        "--from-account",
        "ethereum-1",
        "--to-account",
        "ethereum-1",
        "--amount",
        "0.1",
        "--output",
        "json",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );
    expect(exitCode, `stdout: ${stdout}\nstderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("swap quote");
    expect(data.network).toBe("ethereum");
    expect(Array.isArray(data.quotes)).toBe(true);
    expect(data.quotes.length).toBeGreaterThanOrEqual(1);
    expect(data.quotes[0].provider).toBe("paraswap");
  });

  it("rejects swap currencies outside wallet-cli supported list", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      [
        "swap",
        "quote",
        "--from",
        "dogecoin",
        "--to",
        "bitcoin",
        "--from-account",
        "ethereum-1",
        "--to-account",
        "ethereum-1",
        "--amount",
        "0.1",
        "--output",
        "json",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("Unsupported swap from currency");
    expect(data.error.message).toContain("bitcoin, ethereum, solana");
  });
});

describe("quote command — API auth key", () => {
  const { server, quoteSignature } = makeAuthenticatedQuoteServer();
  const fixture = makeSessionDir(ACCOUNTS);

  beforeAll(() => server.start());
  afterAll(() => {
    server.stop();
    fixture.cleanup();
  });

  it("signs with the profile's stored key and no trustchain attestation", async () => {
    const signature = await quoteSignature(fixture.env);

    expect(signature.attestation).toBeUndefined();
    expect(await storedApiAuthPubkey(fixture.env)).toBe(signature.credential.publicKey);
  });

  it("signs every challenge of a run with the same one-off key when the keychain is unavailable", async () => {
    const signingKeys: string[] = [];
    const quote = makeSwapQuoteRoutes({ rejectTokens: true });
    const rejectingServer = new MockServer([
      ...makeAuthRoutes({
        onAuthenticateRequest: ({ signature }) => {
          signingKeys.push(signature.credential.publicKey);
        },
      }),
      ...quote.routes,
    ]);
    rejectingServer.start();
    useApiAuthKeychain({
      getPassword: () => {
        throw new Error("no secret service");
      },
      setPassword: () => {},
    });
    try {
      await runCli(JSON_QUOTE_ARGS, {
        WALLET_CLI_MOCK_PORT: String(rejectingServer.port),
        ...fixture.env,
      });

      expect(signingKeys).toEqual([expect.any(String), signingKeys[0]]);
    } finally {
      useApiAuthKeychain(null);
      rejectingServer.stop();
    }
  });
});

/**
 * Runs a JSON `swap quote` against `routes` and checks the shared base query sent it without a token
 * after failing to authenticate.
 */
async function expectUnauthenticatedQuote(routes: Route[]): Promise<(string | null)[]> {
  const quote = makeSwapQuoteRoutes({ rejectTokens: true });
  const server = new MockServer([...routes, ...quote.routes]);
  const fixture = makeSessionDir(ACCOUNTS);
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  server.start();
  try {
    const { exitCode, stdout, stderr } = await runCli(JSON_QUOTE_ARGS, {
      WALLET_CLI_MOCK_PORT: String(server.port),
      ...fixture.env,
    });

    expect(exitCode, `stdout: ${stdout}\nstderr: ${stderr}`).toBe(0);
    expect(JSON.parse(stdout).quotes[0].provider).toBe("paraswap");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "AuthenticatedBaseQuery failed to authenticate:",
      expect.any(Error),
    );
    return quote.quoteAuthorizations;
  } finally {
    warn.mockRestore();
    server.stop();
    fixture.cleanup();
  }
}

describe("quote command — authentication failures", () => {
  it("sends the quote without a token when the auth service fails", async () => {
    const keycloakDown: Route = {
      method: "GET",
      match: /\/protocol\/openid-connect\/auth(\?|$)/,
      response: { error: "unavailable" },
      status: 503,
    };

    expect(await expectUnauthenticatedQuote([keycloakDown])).toEqual([null]);
  });

  it("re-authenticates once, then fails the quote when the API rejects the refreshed token", async () => {
    let signedChallenges = 0;
    const quote = makeSwapQuoteRoutes({ rejectTokens: true });
    const server = new MockServer([
      ...makeAuthRoutes({
        onAuthenticateRequest: () => {
          signedChallenges++;
        },
      }),
      ...quote.routes,
    ]);
    const fixture = makeSessionDir(ACCOUNTS);
    server.start();
    try {
      const { exitCode, stdout } = await runCli(JSON_QUOTE_ARGS, {
        WALLET_CLI_MOCK_PORT: String(server.port),
        ...fixture.env,
      });

      expect(exitCode).toBe(1);
      expect(JSON.parse(stdout).error.message).toContain("No quotes available");
      expect(quote.quoteAuthorizations).toEqual([
        `Bearer ${KEYCLOAK_TOKEN}`,
        `Bearer ${KEYCLOAK_TOKEN}`,
      ]);
      expect(signedChallenges).toBe(2);
    } finally {
      server.stop();
      fixture.cleanup();
    }
  });

  describe("when an auth call does not answer", () => {
    beforeAll(() => _setTestAuthRequestTimeoutMs(200));
    afterAll(() => _setTestAuthRequestTimeoutMs(null));

    it.each([
      [
        "the Keycloak challenge",
        { method: "GET", match: /\/protocol\/openid-connect\/auth(\?|$)/ },
      ],
      ["the LKRP challenge response", { method: "POST", match: "/openid/v1/authenticate" }],
    ] as const)("times out %s and sends the quote without a token", async (_, stalled) => {
      // Longer than the whole run may take, so only the timeout can end the auth call in time.
      const stalledRoute: Route = { ...stalled, response: null, onRequest: () => Bun.sleep(3_000) };
      const startedAt = Date.now();

      expect(await expectUnauthenticatedQuote([stalledRoute, ...makeAuthRoutes()])).toEqual([null]);
      expect(Date.now() - startedAt).toBeLessThan(2_000);
    });
  });
});
