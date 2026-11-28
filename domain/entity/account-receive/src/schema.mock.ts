import type { z } from "zod";
import {
  AccountReceiveSchema,
  ReceiveVerificationSchema,
  type AccountReceive,
  type ReceiveMemo,
} from "./schema";

type VerificationInput = z.input<typeof ReceiveVerificationSchema>;

/** Shown at an ethereum path, unless `verification` is given (even `undefined`). */
export function mockAccountReceive(
  overrides: {
    address?: string;
    verification?: VerificationInput;
    memo?: ReceiveMemo;
    shielded?: { address: string; verification?: VerificationInput; memo?: ReceiveMemo };
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
    memo: overrides.memo,
    shielded: overrides.shielded,
  });
}
