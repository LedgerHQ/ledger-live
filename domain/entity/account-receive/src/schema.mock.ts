import type { z } from "zod";
import { AccountReceiveSchema, ReceiveVerificationSchema, type AccountReceive } from "./schema";

type VerificationInput = z.input<typeof ReceiveVerificationSchema>;

/** Shown at an ethereum path, unless `verification` is given (even `undefined`). */
export function mockAccountReceive(
  overrides: {
    address?: string;
    verification?: VerificationInput;
    shielded?: { address: string; verification?: VerificationInput };
  } = {},
): AccountReceive {
  const address = overrides.address ?? "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
  const verification =
    "verification" in overrides
      ? overrides.verification
      : { type: "address", path: "m/44h/60h/0h/0/0", address };
  return AccountReceiveSchema.parse({
    address,
    verification,
    shielded: overrides.shielded,
  });
}
