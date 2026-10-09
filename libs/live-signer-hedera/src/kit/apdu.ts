import type { Apdu, ApduBuilder } from "@ledgerhq/device-management-kit";
import { KEY_INDEX_SIZE } from "./constants";

export const buildApduOrThrow = (builder: ApduBuilder): Apdu => {
  const errors = builder.getErrors();
  if (errors.length > 0) {
    throw new Error(`Invalid Hedera APDU: ${errors.map(e => e.message).join(", ")}`);
  }
  return builder.build();
};

export const encodeKeyIndex = (keyIndex: number): Uint8Array => {
  const bytes = new Uint8Array(KEY_INDEX_SIZE);
  new DataView(bytes.buffer).setUint32(0, keyIndex, true);
  return bytes;
};
