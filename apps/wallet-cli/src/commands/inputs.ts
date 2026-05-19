import { option } from "@bunli/core";
import { z } from "zod";
import { DEFAULT_DEVICE_TIMEOUT_MS } from "../device/connect-ledger-app";
import { OutputFormatSchema, parseAccountDescriptor } from "../wallet/models";
import type { AccountDescriptor } from "../wallet/models";
import { parseV1 } from "../shared/accountDescriptor";
import type { AccountDescriptorV1 } from "../shared/accountDescriptor";
import { Session } from "../session/session-store";

/**
 * Shared --output option used by all commands. If omitted, the CLI keeps
 * human-readable output.
 */
export const outputOption = option(OutputFormatSchema.optional(), {
  description: "Output format: human or json (default: human)",
});

export function resolveOutputFormat(
  output: z.infer<typeof OutputFormatSchema> | undefined,
): z.infer<typeof OutputFormatSchema> {
  return output ?? "human";
}

/**
 * Shared --device-timeout option for every command that requires the device. Overrides the
 * time (ms) ConnectApp waits for the user to unlock / confirm before giving up.
 * Keep the literal Zod default in sync with DEFAULT_DEVICE_TIMEOUT_MS so Bunli can generate
 * the concrete numeric default in command metadata.
 */
export const deviceTimeoutOption = option(z.coerce.number().int().positive().default(60_000), {
  description: `Max time (ms) to wait for the device to unlock / confirm. Default: ${DEFAULT_DEVICE_TIMEOUT_MS}.`,
});

export const accountOption = option(z.string().min(1).optional(), {
  description: "Session label (e.g. ethereum-1). Can also be the first positional arg.",
  short: "a",
});

export function resolveAccountArg(
  account: string | undefined,
  positional: readonly string[],
): string {
  const arg = account ?? positional[0];
  if (!arg) {
    throw new Error(
      "Missing account: use --account <session-label> or pass the label as the first positional argument. Run `account discover` first to populate the session.",
    );
  }
  return arg;
}

// Session label lookup only — raw descriptors are not accepted as CLI arguments.
export async function resolveAccountInput(input: string): Promise<string> {
  if (input.includes(":")) {
    throw new Error(
      "Raw descriptors are not accepted as CLI arguments. Run `account discover` first, then reference the account by its session label (e.g. `--account ethereum-1`).",
    );
  }
  const session = await Session.read();
  const entry = session.accounts.find(e => e.label === input);
  if (!entry) {
    throw new Error(
      `No account labeled "${input}" in session. Run \`account discover\` first to populate the session.`,
    );
  }
  return entry.descriptor;
}

/** Resolve to a V0 AccountDescriptor. Accepts V1 string, V0 string, or session label. */
export async function resolveAccountDescriptor(input: string): Promise<AccountDescriptor> {
  return parseAccountDescriptor(await resolveAccountInput(input));
}

/** Resolve to a V1 AccountDescriptorV1. Accepts V1 string or session label. */
export async function resolveAccountDescriptorV1(input: string): Promise<AccountDescriptorV1> {
  return parseV1(await resolveAccountInput(input));
}
