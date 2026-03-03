import { PsbtV2 } from "@ledgerhq/psbtv2";

/**
 * Deserializes a raw PSBT buffer (v0 or v2) into a PsbtV2 instance.
 */
export function deserializePsbt(psbtBuffer: Buffer): PsbtV2 {
  const psbtVersion = PsbtV2.getPsbtVersionNumber(psbtBuffer);
  const psbt = psbtVersion === 2 ? new PsbtV2() : PsbtV2.fromV0(psbtBuffer, true);

  if (psbtVersion === 2) {
    psbt.deserialize(psbtBuffer);
  }

  return psbt;
}
