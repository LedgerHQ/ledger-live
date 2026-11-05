import { AccountReceiveSchema, type AccountReceive } from "./schema";

type VerificationInput =
  | { type: "address" | "addressConfirmation"; path: string; address: string }
  | { type: "publicKey"; path: string; publicKey: string };

/** The device showing the address at an ethereum path unless `verification` is given, even as `undefined`. */
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
