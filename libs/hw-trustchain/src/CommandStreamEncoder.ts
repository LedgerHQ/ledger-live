import BigEndian from "./BigEndian";
import {
  CommandBlock,
  Command,
  CommandType,
  Derive,
  Seed,
  AddMember,
  CloseStream,
  PublishKey,
  EditMember,
} from "./CommandBlock";

function push(a: Uint8Array, b: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + b.length);
  c.set(a);
  c.set(b, a.length);
  return c;
}

function pushTLV(a: Uint8Array, t: number, l: number, v: Uint8Array): Uint8Array {
  const c = new Uint8Array(a.length + 2 + l);
  c.set(a);
  c.set(new Uint8Array([t, l]), a.length);
  c.set(v, a.length + 2);
  return c;
}

export enum TLVTypes {
  Null = 0,
  VarInt = 1,
  Hash = 2,
  Signature = 3,
  String = 4,
  Bytes = 5,
  PublicKey = 6,
}

export const TLV = {
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

  // Push functions for commands

  packSeed: function (b: Seed): Uint8Array {
    let object = new Uint8Array();
    if (b.topic) {
      object = TLV.pushBytes(object, b.topic);
    } else {
      object = TLV.pushNull(object);
    }
    object = TLV.pushInt16(object, b.protocolVersion);
    object = TLV.pushPublicKey(object, b.groupKey);
    object = TLV.pushBytes(object, b.initializationVector);
    object = TLV.pushBytes(object, b.encryptedXpriv);
    object = TLV.pushPublicKey(object, b.ephemeralPublicKey);
    return object;
  },

  packDerive: function (b: Derive): Uint8Array {
    let object = new Uint8Array();
    object = TLV.pushDerivationPath(object, b.path);
    object = TLV.pushPublicKey(object, b.groupKey);
    object = TLV.pushBytes(object, b.initializationVector);
    object = TLV.pushBytes(object, b.encryptedXpriv);
    object = TLV.pushPublicKey(object, b.ephemeralPublicKey);
    return object;
  },

  packAddMember: function (b: AddMember): Uint8Array {
    let object = new Uint8Array();
    object = TLV.pushString(object, b.name);
    object = TLV.pushPublicKey(object, b.publicKey);
    object = TLV.pushInt32(object, b.permissions);
    return object;
  },

  packPublishKey: function (b: PublishKey): Uint8Array {
    let object = new Uint8Array();
    object = TLV.pushBytes(object, b.initializationVector);
    object = TLV.pushBytes(object, b.encryptedXpriv);
    object = TLV.pushPublicKey(object, b.recipient);
    object = TLV.pushPublicKey(object, b.ephemeralPublicKey);
    return object;
  },

  packCloseStream: function (b: CloseStream): Uint8Array {
    b as CloseStream;
    return new Uint8Array();
  },

  packEditMember: function (b: EditMember): Uint8Array {
    let object = new Uint8Array();
    object = TLV.pushPublicKey(object, b.member);
    if (b.permissions) {
      object = TLV.pushInt32(object, b.permissions);
    } else {
      object = TLV.pushNull(object);
    }
    if (b.name) {
      object = TLV.pushString(object, b.name);
    } else {
      object = TLV.pushNull(object);
    }
    return object;
  },
};

function packCommand(buffer: Uint8Array, command: Command): Uint8Array {
  let object = new Uint8Array();
  switch (command.getType()) {
    case CommandType.Seed:
      object = TLV.packSeed(command as Seed);
      break;
    case CommandType.Derive:
      object = TLV.packDerive(command as Derive);
      break;
    case CommandType.AddMember:
      object = TLV.packAddMember(command as AddMember);
      break;
    case CommandType.PublishKey:
      object = TLV.packPublishKey(command as PublishKey);
      break;
    case CommandType.CloseStream:
      object = TLV.packCloseStream(command as CloseStream);
      break;
    case CommandType.EditMember:
      object = TLV.packEditMember(command as EditMember);
      break;
  }
  buffer = pushTLV(buffer, command.getType(), object.length, object);
  return buffer;
}

export class CommandStreamEncoder {
  public static encode(stream: CommandBlock[]): Uint8Array {
    return pack(stream);
  }

  public static encodeBlockHeader(block: CommandBlock): Uint8Array {
    let buffer = new Uint8Array();
    buffer = TLV.pushByte(buffer, block.version);
    buffer = TLV.pushHash(buffer, block.parent);
    buffer = TLV.pushPublicKey(buffer, block.issuer);
    buffer = TLV.pushByte(buffer, block.commands.length);
    return buffer;
  }

  public static encodeCommand(block: CommandBlock, index: number): Uint8Array {
    if (index >= block.commands.length || index < 0) {
      throw new Error("Index out of range");
    }
    let buffer = new Uint8Array();
    buffer = packCommand(buffer, block.commands[index]);
    return buffer;
  }

  public static encodeSignature(block: CommandBlock): Uint8Array {
    if (block.signature.length === 0) return new Uint8Array();
    return TLV.pushSignature(new Uint8Array(), block.signature);
  }
}

function pack(stream: CommandBlock[]): Uint8Array {
  let buffer = new Uint8Array();
  for (const block of stream) {
    buffer = push(buffer, CommandStreamEncoder.encodeBlockHeader(block));
    for (let index = 0; index < block.commands.length; index++) {
      buffer = push(buffer, CommandStreamEncoder.encodeCommand(block, index));
    }
    buffer = push(buffer, CommandStreamEncoder.encodeSignature(block));
  }
  return buffer;
}
