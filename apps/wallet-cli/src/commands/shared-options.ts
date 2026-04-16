import { option } from "@bunli/core";
import { z } from "zod";
import { OutputFormatSchema } from "../wallet/models";

/**
 * Shared --account / -a option used by all commands that operate on an account descriptor.
 * Accepts both V1 format ("account:1:...") and legacy V0 short form ("js:2:bitcoin:...").
 */
export const accountOption = option(z.string().min(1).optional(), {
  description: "Account descriptor (from account discover), or pass as first positional arg",
  short: "a",
});

/**
 * Shared --output option used by all commands. Defaults to human-readable output.
 */
export const outputOption = option(OutputFormatSchema.default("human"), {
  description: "Output format: human (default) or json",
});
