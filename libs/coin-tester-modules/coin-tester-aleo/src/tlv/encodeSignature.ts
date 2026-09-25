import { encodeTlv, STRUCTURE_TYPE, TLV_TAG, TLV_VERSION_V1 } from "./tags";

/** Byte lengths `decode_signature_tlv` insists on (aleo-backend/src/core/tlv.rs). */
const SIGNATURE_LENGTH = 128;
const FIELD_LENGTH = 32;

export type SignatureTlvParts = {
  /** `Signature<N>` bytes LE: challenge ‖ response ‖ compute key. */
  signature: Uint8Array;
  /** `Field<N>` bytes LE. */
  tvk: Uint8Array;
  /** `Group<N>` bytes LE. */
  tpk: Uint8Array;
  /** One 32-byte `Group<N>` per record input; empty for public transfers. */
  gammas: Uint8Array[];
};

/**
 * Encodes what the device app hands back, so the backend's TLV decoder accepts a
 * signature produced in TypeScript. `ComputeKey` is not a field of its own: it
 * is carried in the last 64 bytes of the signature.
 */
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
