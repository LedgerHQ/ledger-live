import { expect } from "bun:test";
import { runCli } from "./cli-runner";
import { MockServer } from "./mock-server";
import { KEYCLOAK_TOKEN, makeAuthRoutes, type SignedChallenge } from "./auth-routes";
import { SWAP_QUOTE_ARGS, makeSwapQuoteRoutes } from "./swap-quote-routes";

/** Mock auth backend and swap API, recording what each `swap quote` run sends to them. */
export function makeAuthenticatedQuoteServer() {
  const signed: SignedChallenge[] = [];
  const quote = makeSwapQuoteRoutes();
  const server = new MockServer([
    ...makeAuthRoutes({ onAuthenticateRequest: body => signed.push(body) }),
    ...quote.routes,
  ]);

  /**
   * Runs `swap quote` for the profile in `env` without WALLET_PASS, so any password prompt fails the
   * run, and returns the signature of its single auth challenge.
   */
  async function quoteSignature(env: {
    XDG_STATE_HOME: string;
  }): Promise<SignedChallenge["signature"]> {
    signed.length = 0;
    quote.quoteAuthorizations.length = 0;
    const { exitCode, stdout, stderr } = await runCli(SWAP_QUOTE_ARGS, {
      WALLET_CLI_MOCK_PORT: String(server.port),
      ...env,
    });

    expect(exitCode, `stdout: ${stdout}\nstderr: ${stderr}`).toBe(0);
    expect(quote.quoteAuthorizations).toEqual([`Bearer ${KEYCLOAK_TOKEN}`]);
    expect(signed).toEqual([
      expect.objectContaining({
        signature: expect.objectContaining({ credential: expect.anything() }),
      }),
    ]);
    return signed[0].signature;
  }

  return { server, quoteSignature };
}
