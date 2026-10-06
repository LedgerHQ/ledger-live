import { encodeTlv, STRUCTURE_TYPE, TLV_TAG, TLV_VERSION_V1 } from "./tags";

const SIGNATURE_LENGTH = 128;
const FIELD_LENGTH = 32;

export type SignatureTlvParts = {
  /** LE challenge ‖ response ‖ compute key. */
  signature: Uint8Array;
  tvk: Uint8Array;
  tpk: Uint8Array;
  /** One per record input. */
  gammas: Uint8Array[];
};

export function encodeSignatureTlv({ signature, tvk, tpk, gammas }: SignatureTlvParts): string {
  if (signature.length !== SIGNATURE_LENGTH) {
    throw new Error(
      `aleo coin-tester: signature must be ${SIGNATURE_LENGTH} bytes, got ${signature.length}`,
    );
  }
  if (tvk.length !== FIELD_LENGTH) {
    throw new Error(`aleo coin-tester: tvk must be ${FIELD_LENGTH} bytes, got ${tvk.length}`);
  }
  if (tpk.length !== FIELD_LENGTH) {
    throw new Error(`aleo coin-tester: tpk must be ${FIELD_LENGTH} bytes, got ${tpk.length}`);
  }
  for (const gamma of gammas) {
    if (gamma.length !== FIELD_LENGTH) {
      throw new Error(
        `aleo coin-tester: every gamma must be ${FIELD_LENGTH} bytes, got ${gamma.length}`,
      );
    }
  }

  const bytes = [
    ...encodeTlv(TLV_TAG.StructureType, [STRUCTURE_TYPE.Signature]),
    ...encodeTlv(TLV_TAG.Version, [TLV_VERSION_V1]),
    ...encodeTlv(TLV_TAG.Signature, signature),
    ...encodeTlv(TLV_TAG.Tvk, tvk),
    ...encodeTlv(TLV_TAG.Tpk, tpk),
    ...encodeTlv(TLV_TAG.GammasCount, [gammas.length]),
    ...(gammas.length > 0
      ? encodeTlv(
          TLV_TAG.Gammas,
          gammas.flatMap(gamma => Array.from(gamma)),
        )
      : []),
  ];

  return Buffer.from(bytes).toString("hex");
}
