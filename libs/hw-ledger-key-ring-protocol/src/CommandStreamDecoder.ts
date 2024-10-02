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
import { TLV, TLVField } from "./tlv";

export const TLVCommandStreamDecoder = {
  // Read command from TLV

  readCommand: function (tlv: TLVField): Command {
    switch (tlv.type) {
      case CommandType.Seed:
        return TLVCommandStreamDecoder.readSeedCommand(tlv.value);
      case CommandType.Derive:
        return TLVCommandStreamDecoder.readDeriveCommand(tlv.value);
      case CommandType.AddMember:
        return TLVCommandStreamDecoder.readAddMemberCommand(tlv.value);
      case CommandType.PublishKey:
        return TLVCommandStreamDecoder.readPublishKeyCommand(tlv.value);
      case CommandType.EditMember:
        return TLVCommandStreamDecoder.readEditMemberCommand(tlv.value);
      case CommandType.CloseStream:
        return TLVCommandStreamDecoder.readCloseStreamCommand(tlv.value);
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
    const readEphemeralPublicKey = TLV.readPublicKey(
      TLV.readTLV(buffer, readEncryptedXpriv.offset),
    );
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
      const command = TLVCommandStreamDecoder.readCommand(commandBuffer.tlv);
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
