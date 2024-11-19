import { to_hex } from "./NobleCrypto";
import {
  Command,
  CommandBlock,
  CommandType,
  Seed,
  AddMember,
  PublishKey,
  EditMember,
  Derive,
} from "./CommandBlock";
import { DerivationPath } from "./Crypto";
import { CommandStreamEncoder } from "./CommandStreamEncoder";
import { createHash } from "crypto";

export default class CommandStreamJsonifier {
  private static jsonifyCommand(command: Command): object {
    switch (command.getType()) {
      case CommandType.Seed:
        return {
          type: "Seed",
          topic: to_hex((command as Seed).topic),
          groupKey: to_hex((command as Seed).groupKey),
          encryptedXpriv: to_hex((command as Seed).encryptedXpriv),
          ephemeralPublicKey: to_hex((command as Seed).ephemeralPublicKey),
          initializationVector: to_hex((command as Seed).initializationVector),
        };
      case CommandType.AddMember:
        return {
          type: "AddMember",
          name: (command as AddMember).name,
          publicKey: to_hex((command as AddMember).publicKey),
          permissions: (command as AddMember).permissions,
        };
      case CommandType.EditMember:
        return {
          type: "EditMember",
          member: to_hex((command as EditMember).member),
          name: (command as EditMember).name,
          permissions: (command as EditMember).permissions,
        };
      case CommandType.Derive:
        return {
          type: "Derive",
          path: DerivationPath.toString((command as Derive).path),
          groupKey: to_hex((command as Derive).groupKey),
          encryptedXpriv: to_hex((command as Derive).encryptedXpriv),
          ephemeralPublicKey: to_hex((command as Derive).ephemeralPublicKey),
          initializationVector: to_hex((command as Derive).initializationVector),
        };
      case CommandType.CloseStream:
        return {
          type: "CloseStream",
        };
      case CommandType.PublishKey:
        return {
          type: "PublishKey",
          encryptedXpriv: to_hex((command as PublishKey).encryptedXpriv),
          initializationVector: to_hex((command as PublishKey).initializationVector),
          ephemeralPublicKey: to_hex((command as PublishKey).ephemeralPublicKey),
          recipient: to_hex((command as PublishKey).recipient),
        };
    }
  }

  public static jsonify(stream: CommandBlock[]): object {
    return stream.map(block => {
      const b = CommandStreamEncoder.encode([block]);
      const h = createHash("sha256");
      h.update(b);
      return {
        parent: to_hex(block.parent),
        issuer: to_hex(block.issuer),
        hash: h.digest().toString("hex"),
        command: block.commands.map(command => {
          return CommandStreamJsonifier.jsonifyCommand(command);
        }),
        signature: to_hex(block.signature),
      };
    });
  }
}
