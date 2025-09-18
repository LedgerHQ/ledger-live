export type DescriptorInput = {
  data: Buffer;
  signature: Buffer;
};

function buildTLV(tag: Buffer, value: Buffer): Buffer {
  const length = value.length;

  if (length > 0xff) {
    throw new Error("Value length exceeds 255 bytes");
  }

  return Buffer.concat([tag, new Uint8Array([length]), value]);
}

export function buildDescriptor({ data, signature }: DescriptorInput): Buffer {
  const SIGNATURE_TAG = Buffer.from(new Uint8Array([0x08]));
  return Buffer.concat([data, buildTLV(SIGNATURE_TAG, signature)]);
}
