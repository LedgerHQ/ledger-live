export type SuiMoveObject = {
  serialize: () => SerializedBcs;
};

export type SerializedBcs = {
  toBytes: () => Uint8Array;
  toHex: () => string;
  toBase64: () => string;
  toBase58: () => string;
};
