import BigEndian from "./BigEndian";

export enum TLVTypes {
  Null = 0,
  VarInt = 1,
  Hash = 2,
  Signature = 3,
  String = 4,
  Bytes = 5,
  PublicKey = 6,
}

export interface TLVField {
  type: number;
  value: Uint8Array;
}

export type TLVReaderParams = { tlv: TLVField; offset: number };

function pushTLV(a: Uint8Array, t: number, l: number, v: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + 2 + l);
  c.set(a);
  c.set(new Uint8Array([t, l]), a.length);
  c.set(v, a.length + 2);
  return c;
}

function push(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return c;
}

// Generic part of the TLV encoding/decoding
export const TLV = {
  readTLV: function (buffer: Uint8Array, offset: number): { tlv: TLVField; offset: number } {
    const type = buffer[offset];
    offset += 1;
    const length = buffer[offset];
    offset += 1;
    const value = buffer.slice(offset, offset + length);
    offset += length;
    return { tlv: { type, value }, offset };
  },

  readAllTLV: function (buffer: Uint8Array, offset: number): TLVField[] {
    const result: TLVField[] = [];

    while (offset < buffer.length) {
      const tlv = TLV.readTLV(buffer, offset);
      offset = tlv.offset;
      result.push(tlv.tlv);
    }
    return result;
  },

  readVarInt: function (read: { tlv: TLVField; offset: number }): {
    value: number;
    offset: number;
  } {
    if (read.tlv.type != TLVTypes.VarInt) {
      throw new Error(
        `Invalid type for var int (at offset ${read.offset - 2 - read.tlv.value.length}))`,
      );
    }
    const fill = 4 - read.tlv.value.length;
    const normalized = TLV.push(new Uint8Array([0, 0, 0, 0].slice(0, fill)), read.tlv.value);
    const value = BigEndian.arrayToNumber(normalized);
    return { value, offset: read.offset };
  },

  readBytes: function (read: { tlv: TLVField; offset: number }): {
    value: Uint8Array;
    offset: number;
  } {
    if (read.tlv.type != TLVTypes.Bytes) {
      throw new Error(
        `Invalid type for bytes (at offset ${read.offset - 2 - read.tlv.value.length}))`,
      );
    }
    const value = read.tlv.value;
    return { value, offset: read.offset };
  },

  readDerivationPath: function (read: { tlv: TLVField; offset: number }): {
    value: number[];
    offset: number;
  } {
    const bytes = TLV.readBytes(read);
    const view = new DataView(bytes.value.buffer);
    const value: number[] = [];
    for (let offset = 0; offset < bytes.value.length; offset += 4) {
      value.push(view.getUint32(offset, false));
    }
    return { value, offset: bytes.offset };
  },

  readString: function (read: { tlv: TLVField; offset: number }): {
    value: string;
    offset: number;
  } {
    if (read.tlv.type != TLVTypes.String) {
      throw new Error(
        `Invalid type for string (at offset ${read.offset - 2 - read.tlv.value.length}))`,
      );
    }
    const value = new TextDecoder().decode(read.tlv.value);
    return { value, offset: read.offset };
  },

  readHash: function (read: { tlv: TLVField; offset: number }): {
    value: Uint8Array;
    offset: number;
  } {
    if (read.tlv.type != TLVTypes.Hash) {
      throw new Error(
        `Invalid type for hash (at offset ${read.offset - 2 - read.tlv.value.length}))`,
      );
    }
    const value = read.tlv.value;
    return { value, offset: read.offset };
  },

  readSignature: function (read: { tlv: TLVField; offset: number }): {
    value: Uint8Array;
    offset: number;
  } {
    if (read.tlv.type != TLVTypes.Signature) {
      throw new Error(
        `Invalid type for signature (at offset ${read.offset - 2 - read.tlv.value.length}))`,
      );
    }
    const value = read.tlv.value;
    return { value, offset: read.offset };
  },

  readPublicKey: function (read: { tlv: TLVField; offset: number }): {
    value: Uint8Array;
    offset: number;
  } {
    if (read.tlv.type != TLVTypes.PublicKey) {
      throw new Error(
        `Invalid type for public key (at offset ${read.offset - 2 - read.tlv.value.length}))`,
      );
    }
    const value = read.tlv.value;
    return { value, offset: read.offset };
  },

  readNullOr: function <Type>(
    read: { tlv: TLVField; offset: number },
    func: (read: TLVReaderParams) => { value: Type; offset: number },
  ): { value: Type | null; offset: number } {
    if (read.tlv.type == TLVTypes.Null) {
      return { value: null, offset: read.offset };
    }
    return func(read);
  },

  push,
  pushTLV,

  pushString: function (a: Uint8Array, b: string): Uint8Array {
    const encoded = new TextEncoder().encode(b);
    return pushTLV(a, 0x04, encoded.length, encoded);
  },

  pushByte: function (a: Uint8Array, b: number): Uint8Array {
    return pushTLV(a, 0x01, 1, new Uint8Array([b]));
  },

  pushInt16: function (a: Uint8Array, b: number): Uint8Array {
    const bytes = BigEndian.shortToArray(b);
    return pushTLV(a, 0x01, 2, bytes);
  },

  pushInt32: function (a: Uint8Array, b: number): Uint8Array {
    const bytes = BigEndian.numberToArray(b);
    return pushTLV(a, 0x01, 4, bytes);
  },

  pushHash: function (a: Uint8Array, b: Uint8Array): Uint8Array {
    return pushTLV(a, 0x02, b.length, b);
  },

  pushSignature: function (a: Uint8Array, b: Uint8Array): Uint8Array {
    return pushTLV(a, 0x03, b.length, b);
  },

  pushBytes: function (a: Uint8Array, b: Uint8Array): Uint8Array {
    return pushTLV(a, 0x05, b.length, b);
  },

  pushNull: function (a: Uint8Array): Uint8Array {
    return pushTLV(a, 0x00, 0, new Uint8Array(0));
  },

  pushPublicKey: function (a: Uint8Array, b: Uint8Array): Uint8Array {
    return pushTLV(a, 0x06, b.length, b);
  },

  pushDerivationPath: function (a: Uint8Array, b: number[]): Uint8Array {
    let bytes = new Uint8Array();
    for (let i = 0; i < b.length; i++) {
      bytes = push(bytes, BigEndian.numberToArray(b[i]));
    }
    return TLV.pushBytes(a, bytes);
  },
};
