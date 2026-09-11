export const GET_VERSION_APDU = "e001000000";
export const GET_VERSION_PREFIX = "e001";

/** Onboarding steps, as encoded in the fourth flag byte of a GET_VERSION reply. */
export const ONBOARDING_STEP = {
  pin: 0x06,
  newDevice: 0x07,
  newDeviceConfirming: 0x08,
  restoreSeed: 0x09,
  ready: 0x0b,
} as const;

/**
 * Rewrites the onboarding flags inside a real GET_VERSION reply.
 *
 * The reply is `targetId | seVersion | flags | …`, each length-prefixed, so the flags
 * are located by walking it rather than assumed — their offset moves with the length
 * of the firmware string, and the targetId differs per model.
 *
 * `onboarded` has to agree with the step: reporting `ready` without it leaves the
 * companion stuck, with no error to explain why.
 */
export function withOnboardingFlags(
  getVersionReply: string,
  step: number,
  onboarded: boolean,
): string {
  const reply = Buffer.from(getVersionReply, "hex");

  const seVersionLength = reply[4]; // after the 4-byte targetId
  const flagsOffset = 5 + seVersionLength + 1;
  const flagsLength = reply[flagsOffset - 1];
  if (!flagsLength) {
    throw new Error(`Could not locate the flag bytes in GET_VERSION reply "${getVersionReply}"`);
  }

  reply[flagsOffset] = onboarded ? reply[flagsOffset] | 0x04 : reply[flagsOffset] & ~0x04;
  reply[flagsOffset + flagsLength - 1] = step;

  return reply.toString("hex");
}
