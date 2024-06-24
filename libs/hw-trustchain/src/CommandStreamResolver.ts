import {
  CommandBlock,
  Command,
  verifyCommandBlock,
  Seed,
  AddMember,
  PublishKey,
  Derive,
  CommandType,
  hashCommandBlock,
  Permissions,
} from "./CommandBlock";
import { crypto } from "./Crypto";

interface PublishedKey {
  encryptedXpriv: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  issuer: Uint8Array;
  initialiationVector: Uint8Array;
}

type MemberData = {
  id: string;
  name: string;
  permissions: number;
};

class ResolvedCommandStreamInternals {
  public isCreated: boolean = false;
  public members: Uint8Array[] = [];
  public membersData: MemberData[] = [];
  public topic: Uint8Array | null = null;
  public keys: Map<string, PublishedKey> = new Map();
  public permission: Map<string, number> = new Map();
  public height: number = 0;
  public streamId: string = "";
  public hashes: string[] = [];
  public names: Map<string, string> = new Map();
  public groupPublicKey: Uint8Array = new Uint8Array();
  public derivationPath: number[] = [];
}

export class ResolvedCommandStream {
  private _internals: ResolvedCommandStreamInternals;

  constructor(internals: ResolvedCommandStreamInternals) {
    this._internals = internals;
  }

  public isCreated(): boolean {
    return this._internals.isCreated;
  }

  public getMembers(): Uint8Array[] {
    return this._internals.members;
  }

  public getMembersData(): MemberData[] {
    return this._internals.membersData;
  }

  public getTopic(): Uint8Array | null {
    return this._internals.topic;
  }

  public isOwner(publicKey: Uint8Array): boolean {
    return this._internals.permission.get(crypto.to_hex(publicKey)) === Permissions.OWNER;
  }

  public isKeyCreator(publicKey: Uint8Array): boolean {
    return (
      (this._internals.permission.get(crypto.to_hex(publicKey))! & Permissions.KEY_CREATOR) ===
      Permissions.KEY_CREATOR
    );
  }

  public ownsKey(publicKey: Uint8Array): boolean {
    return this._internals.keys.get(crypto.to_hex(publicKey)) !== undefined;
  }

  public isMemberAdder(publicKey: Uint8Array): boolean {
    return (
      (this._internals.permission.get(crypto.to_hex(publicKey))! & Permissions.ADD_MEMBER) ===
      Permissions.ADD_MEMBER
    );
  }

  public isMemberRemover(publicKey: Uint8Array): boolean {
    return (
      (this._internals.permission.get(crypto.to_hex(publicKey))! & Permissions.REMOVE_MEMBER) ===
      Permissions.REMOVE_MEMBER
    );
  }

  public keyCount(): number {
    return this._internals.keys.size;
  }

  public getEncryptedKey(publicKey: Uint8Array): PublishedKey | null {
    const key = this._internals.keys.get(crypto.to_hex(publicKey));
    if (key) return key;
    return null;
  }

  public getGroupPublicKey(): Uint8Array {
    return this._internals.groupPublicKey;
  }

  public getStreamDerivationPath(): number[] {
    return this._internals.derivationPath;
  }
}

function exists(list: Uint8Array[], obj: Uint8Array): boolean {
  for (const item of list) {
    if (obj.length !== item.length) {
      continue;
    }
    for (let i = 0; i < item.length; i++) {
      if (item[i] !== obj[i]) {
        continue;
      }
    }
    return true;
  }
  return false;
}

export default class CommandStreamResolver {
  private static assertIssuerCanPublish(
    issuer: Uint8Array,
    internals: ResolvedCommandStreamInternals,
  ): void {
    if (!exists(internals.members, issuer)) {
      throw new Error("Issuer is not a member of the group at height " + internals.height);
    }
    if ((internals.permission.get(crypto.to_hex(issuer))! & 0x02) === Permissions.KEY_READER) {
      throw new Error(
        "Issuer does not have permission to publish keys at height " + internals.height,
      );
    }
    if (
      internals.keys.get(crypto.to_hex(issuer)) === undefined &&
      (internals.permission.get(crypto.to_hex(issuer))! & Permissions.KEY_CREATOR) !=
        Permissions.KEY_CREATOR
    ) {
      throw new Error("Issuer does not have a key to publish at height " + internals.height);
    }
    if (
      !internals.keys.has(crypto.to_hex(issuer)) &&
      (internals.permission.get(crypto.to_hex(issuer))! & Permissions.KEY_CREATOR) !==
        Permissions.KEY_CREATOR &&
      internals.keys.keys.length > 0
    ) {
      throw new Error("Issuer is trying to publish a new key at height " + internals.height);
    }
  }

  private static assertIssuerCanAddMember(
    issuer: Uint8Array,
    internals: ResolvedCommandStreamInternals,
  ): void {
    if (!exists(internals.members, issuer)) {
      throw new Error("Issuer is not a member of the group at height " + internals.height);
    }
    if (
      (internals.permission.get(crypto.to_hex(issuer))! & Permissions.ADD_MEMBER) !==
      Permissions.ADD_MEMBER
    ) {
      throw new Error(
        "Issuer does not have permission to add members at height " + internals.height,
      );
    }
  }

  private static assertStreamIsCreated(internals: ResolvedCommandStreamInternals): void {
    if (internals.isCreated === false) {
      throw new Error("The stream is not created at height " + internals.height);
    }
  }

  private static replayCommand(
    command: Command,
    block: CommandBlock,
    blockHash: string,
    height: number,
    internals: ResolvedCommandStreamInternals,
  ): ResolvedCommandStreamInternals {
    switch (command.getType()) {
      case CommandType.Seed:
        internals.isCreated = true;
        internals.topic = (command as Seed).topic;
        internals.members.push(block.issuer);
        internals.permission.set(crypto.to_hex(block.issuer), Permissions.OWNER);
        internals.streamId = blockHash;
        internals.keys.set(crypto.to_hex(block.issuer), {
          encryptedXpriv: (command as Seed).encryptedXpriv,
          issuer: block.issuer,
          ephemeralPublicKey: (command as Seed).ephemeralPublicKey,
          initialiationVector: (command as Seed).initializationVector,
        });
        internals.groupPublicKey = (command as Seed).groupKey;
        break;
      case CommandType.Derive:
        internals.isCreated = true;
        internals.members.push(block.issuer);
        internals.permission.set(crypto.to_hex(block.issuer), Permissions.OWNER);
        internals.streamId = blockHash;
        internals.keys.set(crypto.to_hex(block.issuer), {
          encryptedXpriv: (command as Derive).encryptedXpriv,
          ephemeralPublicKey: (command as Derive).ephemeralPublicKey,
          initialiationVector: (command as Derive).initializationVector,
          issuer: block.issuer,
        });
        internals.groupPublicKey = (command as Derive).groupKey;
        internals.derivationPath = (command as Derive).path;
        break;
      case CommandType.AddMember: {
        this.assertStreamIsCreated(internals);
        this.assertIssuerCanAddMember(block.issuer, internals);
        const { publicKey, permissions, name } = command as AddMember;
        const id = crypto.to_hex(publicKey);
        internals.members.push(publicKey);
        internals.permission.set(id, permissions);
        internals.names.set(id, name);
        internals.membersData.push({ id, name, permissions });
        break;
      }
      case CommandType.PublishKey:
        this.assertStreamIsCreated(internals);
        this.assertIssuerCanPublish(block.issuer, internals);
        internals.keys.set(crypto.to_hex((command as PublishKey).recipient), {
          encryptedXpriv: (command as PublishKey).encryptedXpriv,
          ephemeralPublicKey: (command as PublishKey).ephemeralPublicKey,
          issuer: block.issuer,
          initialiationVector: (command as PublishKey).initializationVector,
        });
        break;
    }
    return internals;
  }

  private static async resolveBlock(
    block: CommandBlock,
    height: number,
    internals: ResolvedCommandStreamInternals,
  ): Promise<ResolvedCommandStreamInternals> {
    // Check signature
    if ((await verifyCommandBlock(block)) === false) {
      throw new Error("Invalid block signature at height " + height);
    }
    // Check if issuer is part of the group
    if (height > 0 && !exists(internals.members, block.issuer)) {
      throw new Error("Issuer is not part of the group at height " + height);
    }

    const blockHash = crypto.to_hex(await hashCommandBlock(block));

    for (const command of block.commands) {
      internals = CommandStreamResolver.replayCommand(command, block, blockHash, height, internals);
    }
    internals.hashes.push(blockHash);
    return internals;
  }

  public static async resolve(stream: CommandBlock[]): Promise<ResolvedCommandStream> {
    let internals = new ResolvedCommandStreamInternals();
    for (let height = 0; height < stream.length; height++) {
      internals.height = height;
      const block = stream[height];
      if (
        height > 0 &&
        crypto.to_hex(block.parent) !== crypto.to_hex(await hashCommandBlock(stream[height - 1]))
      ) {
        throw new Error(
          "Command stream has been tampered with (invalid parent hash) at height " + height,
        );
      }
      if (block.signature.length === 0) break;
      internals = await CommandStreamResolver.resolveBlock(block, height, internals);
    }
    return new ResolvedCommandStream(internals);
  }
}
