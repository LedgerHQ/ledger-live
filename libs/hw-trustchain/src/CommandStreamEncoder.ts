import { TLV } from "./tlv";
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

export const TLVCommandStreamEncoder = {
  packSeed: function (b: Seed): Uint8Array {
    let object = new Uint8Array();
    if (b.topic) {
      object = TLV.pushBytes(object, b.topic);
    } else {
      object = TLV.pushBytes(object, new Uint8Array(0));
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
      object = TLVCommandStreamEncoder.packSeed(command as Seed);
      break;
    case CommandType.Derive:
      object = TLVCommandStreamEncoder.packDerive(command as Derive);
      break;
    case CommandType.AddMember:
      object = TLVCommandStreamEncoder.packAddMember(command as AddMember);
      break;
    case CommandType.PublishKey:
      object = TLVCommandStreamEncoder.packPublishKey(command as PublishKey);
      break;
    case CommandType.CloseStream:
      object = TLVCommandStreamEncoder.packCloseStream(command as CloseStream);
      break;
    case CommandType.EditMember:
      object = TLVCommandStreamEncoder.packEditMember(command as EditMember);
      break;
  }
  buffer = TLV.pushTLV(buffer, command.getType(), object.length, object);
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
    buffer = TLV.push(buffer, CommandStreamEncoder.encodeBlockHeader(block));
    for (let index = 0; index < block.commands.length; index++) {
      buffer = TLV.push(buffer, CommandStreamEncoder.encodeCommand(block, index));
    }
    buffer = TLV.push(buffer, CommandStreamEncoder.encodeSignature(block));
  }
  return buffer;
}
