import { option } from "@bunli/core";
import { z } from "zod";
import { OutputFormatSchema, parseAccountDescriptor } from "../wallet/models";
import type { AccountDescriptor } from "../wallet/models";
import { parseV1 } from "../shared/accountDescriptor";
import type { AccountDescriptorV1 } from "../shared/accountDescriptor";
import { Session } from "../session/session-store";

export const accountOption = option(z.string().min(1).optional(), {
  description: "Account descriptor or session label (e.g. ethereum-1). Can also be the first positional arg.",
  short: "a",
});

export const outputOption = option(OutputFormatSchema.default("human"), {
  description: "Output format: human (default) or json",
});

export function resolveAccountArg(
  account: string | undefined,
  positional: readonly string[],
): string {
  const arg = account ?? positional[0];
  if (!arg) {
    throw new Error(
      "Missing account: use --account <descriptor-or-label> or pass it as the first positional argument.",
    );
  }
  return arg;
}

// Contains ":" → descriptor passthrough; no ":" → session label lookup.
export async function resolveAccountInput(input: string): Promise<string> {
  if (input.includes(":")) return input;
  const session = await Session.read();
  const entry = session.accounts.find(e => e.label === input);
  if (!entry) {
    throw new Error(
      `No account labeled "${input}" in session. Run \`account discover\` first or pass a full descriptor.`,
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
