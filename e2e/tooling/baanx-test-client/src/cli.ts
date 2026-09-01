import { ENV_VARS } from "./config";
import { flagNameOf, parseCliArgs } from "./cliArgs";
import type { OutputFormat } from "./cliArgs";
import { BaanxAuthError } from "./errors";
import { getBaanxAuthToken } from "./auth/session";
import type { BaanxAuthSession } from "./types";

/**
 * CLI for Postman, curl and CI.
 *
 * `TOKEN=$(pnpm --silent --filter @ledgerhq/baanx-test-client token)` is the point
 * of this file, so stdout carries the bare token and nothing else. Progress and
 * failures go to stderr.
 *
 * There are deliberately **no flags for credentials**. Anything secret would
 * show up in the process list and in shell history, so the email, password,
 * client key and TOTP secret are read from the environment only.
 */

/** Left-align the variable names so the descriptions line up in a terminal. */
function describeVars(): string {
  const rows: [string, string][] = [
    [ENV_VARS.clientKey, "Baanx x-client-key (sandbox needs its own key)"],
    [ENV_VARS.email, "Test user email"],
    [ENV_VARS.password, "Test user password"],
    [ENV_VARS.totpSecret, "Authenticator setup key (base32)"],
    [ENV_VARS.baseUrl, "Optional; defaults to the sandbox host"],
    [ENV_VARS.region, `Optional; "international" (default) or "us"`],
  ];
  const width = Math.max(...rows.map(([name]) => name.length));

  return rows.map(([name, note]) => `  ${name.padEnd(width)}  ${note}`).join("\n");
}

const USAGE = `Usage: pnpm --silent --filter @ledgerhq/baanx-test-client token [--json]

Prints a Baanx access token for the configured test user.

  --json     Print the full session object instead of the bare token.
  --session  Print a PayCardSession JSON for CARD_SESSION_BOOTSTRAP, to start
             Ledger Wallet Desktop already signed in (dev and E2E only).
  --help     Show this message.

Configuration is read from the environment only:

${describeVars()}

See e2e/tooling/baanx-test-client/README.md.
`;

async function main(argv: string[]): Promise<number> {
  const parsed = parseCliArgs(argv);

  if (parsed.kind === "help") {
    process.stdout.write(USAGE);
    return 0;
  }

  if (parsed.kind === "unknown") {
    process.stderr.write(
      `Unrecognised argument: ${flagNameOf(parsed.argument)}\n\n` +
        `Credentials are never passed as flags — they would leak into the process list and shell ` +
        `history. Set them in the environment instead.\n\n${USAGE}`,
    );
    return 2;
  }

  const session = await getBaanxAuthToken();

  process.stdout.write(`${render(session, parsed.format)}\n`);

  return 0;
}

/**
 * The Baanx password login returns no refresh token, but the app treats a session as valid only when
 * the access token, the refresh token and the lifetimes all agree. The placeholder satisfies that
 * read; nothing can refresh with it, which is fine for a session shorter than the 6h token life.
 */
const REFRESH_TOKEN_PLACEHOLDER = "no-refresh-token-from-password-login";

function render(session: BaanxAuthSession, format: OutputFormat): string {
  if (format === "token") return session.accessToken;
  if (format === "json") return JSON.stringify(session, null, 2);

  const expiresIn = Math.max(
    1,
    Math.floor((Date.parse(session.expiresAt) - Date.parse(session.issuedAt)) / 1000),
  );

  // Matches the app's PayCardSession exactly: accessToken, refreshToken, expiresIn.
  return JSON.stringify({
    accessToken: session.accessToken,
    refreshToken: REFRESH_TOKEN_PLACEHOLDER,
    expiresIn,
  });
}

main(process.argv.slice(2))
  .then(code => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    process.stderr.write(`${describe(error)}\n`);
    process.exitCode = 1;
  });

/**
 * Render a failure for a human. Error messages from this package are already
 * free of secrets, and any attached body has been through `redactBody`.
 */
function describe(error: unknown): string {
  if (error instanceof BaanxAuthError) {
    const body = (error as { body?: unknown }).body;
    const detail = body === undefined ? "" : `\n\n${JSON.stringify(body, null, 2)}`;
    return `${error.name}: ${error.message}${detail}`;
  }

  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
