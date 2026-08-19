import { ENV_VARS } from "./config";
import { parseCliArgs } from "./cliArgs";
import { BaanxAuthError } from "./errors";
import { getBaanxAuthToken } from "./auth/session";

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

  --json   Print the full session object instead of the bare token.
  --help   Show this message.

Configuration is read from the environment only:

${describeVars()}

See libs/baanx-test-client/README.md.
`;

async function main(argv: string[]): Promise<number> {
  const parsed = parseCliArgs(argv);

  if (parsed.kind === "help") {
    process.stdout.write(USAGE);
    return 0;
  }

  if (parsed.kind === "unknown") {
    process.stderr.write(
      `Unrecognised argument: ${parsed.argument}\n\n` +
        `Credentials are never passed as flags — they would leak into the process list and shell ` +
        `history. Set them in the environment instead.\n\n${USAGE}`,
    );
    return 2;
  }

  const asJson = parsed.asJson;

  const session = await getBaanxAuthToken();

  process.stdout.write(
    asJson ? `${JSON.stringify(session, null, 2)}\n` : `${session.accessToken}\n`,
  );

  return 0;
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
