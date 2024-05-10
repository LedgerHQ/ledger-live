import BigEndian from "./BigEndian";
import {
  Command,
  CommandBlock,
  Seed,
  AddMember,
  CloseStream,
  Derive,
  EditMember,
  PublishKey,
  CommandType,
} from "./CommandBlock";
import { TLVTypes } from "./CommandStreamEncoder";

export interface TLVField {
  type: number;
  value: Uint8Array;
}

export type TLVReaderParams = { tlv: TLVField; offset: number };

export const TLV = {
  push: function (a: Uint8Array, b: Uint8Array): Uint8Array {
    const c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
  },

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

  // Read command from TLV

  readCommand: function (tlv: TLVField): Command {
    switch (tlv.type) {
      case CommandType.Seed:
        return TLV.readSeedCommand(tlv.value);
      case CommandType.Derive:
        return TLV.readDeriveCommand(tlv.value);
      case CommandType.AddMember:
        return TLV.readAddMemberCommand(tlv.value);
      case CommandType.PublishKey:
        return TLV.readPublishKeyCommand(tlv.value);
      case CommandType.EditMember:
        return TLV.readEditMemberCommand(tlv.value);
      case CommandType.CloseStream:
        return TLV.readCloseStreamCommand(tlv.value);
      default:
        throw new Error("Unknown command type");
    }
  },

  readSeedCommand: function (buffer: Uint8Array): Command {
    const readTopic = TLV.readNullOr(TLV.readTLV(buffer, 0), TLV.readBytes);
    const readProtocolVersion = TLV.readVarInt(TLV.readTLV(buffer, readTopic.offset));
    const readGroupKey = TLV.readPublicKey(TLV.readTLV(buffer, readProtocolVersion.offset));
    const readIV = TLV.readBytes(TLV.readTLV(buffer, readGroupKey.offset));
    const readEncryptedXpriv = TLV.readBytes(TLV.readTLV(buffer, readIV.offset));
    const readEphemeralPublicKey = TLV.readPublicKey(
      TLV.readTLV(buffer, readEncryptedXpriv.offset),
    );
    return new Seed(
      readTopic.value,
      readProtocolVersion.value,
      readGroupKey.value,
      readIV.value,
      readEncryptedXpriv.value,
      readEphemeralPublicKey.value,
    );
  },

  readDeriveCommand: function (buffer: Uint8Array): Command {
    const readPath = TLV.readDerivationPath(TLV.readTLV(buffer, 0));
    const readGroupKey = TLV.readPublicKey(TLV.readTLV(buffer, readPath.offset));
    const readIV = TLV.readBytes(TLV.readTLV(buffer, readGroupKey.offset));
    const readEncryptedXpriv = TLV.readBytes(TLV.readTLV(buffer, readIV.offset));
    const readEphemeralPublicKey = TLV.readBytes(TLV.readTLV(buffer, readEncryptedXpriv.offset));
    return new Derive(
      readPath.value,
      readGroupKey.value,
      readIV.value,
      readEncryptedXpriv.value,
      readEphemeralPublicKey.value,
    );
  },

  readAddMemberCommand: function (buffer: Uint8Array): Command {
    const readName = TLV.readString(TLV.readTLV(buffer, 0));
    const pubkey = TLV.readPublicKey(TLV.readTLV(buffer, readName.offset));
    const permissions = TLV.readVarInt(TLV.readTLV(buffer, pubkey.offset));
    return new AddMember(readName.value, pubkey.value, permissions.value);
  },

  readPublishKeyCommand: function (buffer: Uint8Array): Command {
    const IV = TLV.readBytes(TLV.readTLV(buffer, 0));
    const encryptedXpriv = TLV.readBytes(TLV.readTLV(buffer, IV.offset));
    const recipient = TLV.readPublicKey(TLV.readTLV(buffer, encryptedXpriv.offset));
    const ephemeralPublicKey = TLV.readPublicKey(TLV.readTLV(buffer, recipient.offset));

    return new PublishKey(
      IV.value,
      encryptedXpriv.value,
      recipient.value,
      ephemeralPublicKey.value,
    );
  },

  readCloseStreamCommand: function (buffer: Uint8Array): Command {
    buffer as Uint8Array;
    return new CloseStream();
  },

  readEditMemberCommand: function (buffer: Uint8Array): Command {
    const member = TLV.readPublicKey(TLV.readTLV(buffer, 0));
    const permissions = TLV.readNullOr(TLV.readTLV(buffer, member.offset), TLV.readVarInt);
    const name = TLV.readNullOr(TLV.readTLV(buffer, permissions.offset), TLV.readString);
    return new EditMember(member.value, name.value, permissions.value);
  },
};

function unpack(buffer: Uint8Array): CommandBlock[] {
  const stream: CommandBlock[] = [];
  let offset = 0;

  while (offset < buffer.length) {
    const version = TLV.readVarInt(TLV.readTLV(buffer, offset));
    const parent = TLV.readHash(TLV.readTLV(buffer, version.offset));
    const issuer = TLV.readPublicKey(TLV.readTLV(buffer, parent.offset));
    const length = TLV.readVarInt(TLV.readTLV(buffer, issuer.offset));
    offset = length.offset;

    const commands: Command[] = [];
    for (let index = 0; index < length.value; index++) {
      const commandBuffer = TLV.readTLV(buffer, offset);
      const command = TLV.readCommand(commandBuffer.tlv);
      commands.push(command);
      offset = commandBuffer.offset;
    }

    const signature = TLV.readSignature(TLV.readTLV(buffer, offset));
    offset = signature.offset;
    stream.push({
      version: version.value,
      parent: parent.value,
      issuer: issuer.value,
      commands,
      signature: signature.value,
    });
  }
  return stream;
}

export class CommandStreamDecoder {
  public static decode(buffer: Uint8Array): CommandBlock[] {
    return unpack(buffer);
  }
}
