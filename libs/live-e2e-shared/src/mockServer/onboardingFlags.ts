export const GET_VERSION_APDU = "e001000000";
export const GET_VERSION_PREFIX = "e001";

const ONBOARDING_FLAGS_LENGTH = 4;
const ONBOARDING_STEP_FLAG_INDEX = 3;

/** Onboarding steps, as encoded in the fourth flag byte of a GET_VERSION reply. */
export const ONBOARDING_STEP = {
  pin: 0x06,
  newDevice: 0x07,
  newDeviceConfirming: 0x08,
  restoreSeed: 0x09,
  ready: 0x0b,
} as const;

/** Ledger Recovery Key backup states. */
export const CHARON_STATUS = {
  rejected: 0x1,
  choice: 0x2,
  running: 0x3,
  naming: 0x4,
  ready: 0x5,
} as const;

/** Trailing fields are mcuVersion, bootloader, language, recover, charon — no device
 * with a Recovery Key reports the hardware version a Nano X inserts before language. */
const CHARON_TLV_INDEX = 4;
const STATUS_WORD_LENGTH = 2;

const tlv = (...payload: number[]) => Buffer.from([payload.length, ...payload]);

/** Appends the LRK field, or replaces it so repeated pins do not stack copies. */
export function withCharonState(getVersionReply: string, status: number): string {
  const reply = Buffer.from(getVersionReply, "hex");
  const body = reply.subarray(0, reply.length - STATUS_WORD_LENGTH);
  const statusWord = reply.subarray(reply.length - STATUS_WORD_LENGTH);

  const seVersionLength = body[4];
  const flagsOffset = 5 + seVersionLength + 1;
  const flagsLength = body[flagsOffset - 1];
  const headLength = flagsOffset + flagsLength;

  const tlvs: Buffer[] = [];
  for (let i = headLength; i < body.length; i += 1 + body[i]) {
    tlvs.push(body.subarray(i, i + 1 + body[i]));
  }

  const walked = tlvs.reduce((total, entry) => total + entry.length, headLength);
  if (walked !== body.length || tlvs.length < CHARON_TLV_INDEX) {
    throw new Error(`Could not walk the trailing fields of GET_VERSION reply "${getVersionReply}"`);
  }

  tlvs[CHARON_TLV_INDEX] = tlv(status);

  return Buffer.concat([body.subarray(0, headLength), ...tlvs, statusWord]).toString("hex");
}

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
  if (!flagsLength || flagsLength < ONBOARDING_FLAGS_LENGTH) {
    throw new Error(`Could not locate the flag bytes in GET_VERSION reply "${getVersionReply}"`);
  }

  reply[flagsOffset] = onboarded ? reply[flagsOffset] | 0x04 : reply[flagsOffset] & ~0x04;
  reply[flagsOffset + ONBOARDING_STEP_FLAG_INDEX] = step;

  return reply.toString("hex");
}
