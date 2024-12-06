import { CommandStreamEncoder } from "./CommandStreamEncoder";
import { crypto } from "./Crypto";

/**
 *
 */
export interface Command {
  getType(): CommandType;
}

/**
 *
 */
export enum CommandType {
  Seed = 0x10,
  AddMember = 0x11,
  PublishKey = 0x12,
  EditMember = 0x14,
  Derive = 0x15,
  CloseStream = 0x13,
}

/**
 *
 */
export const Permissions = {
  KEY_READER: 0x01,
  KEY_CREATOR: 0x02,
  KEY_REVOKER: 0x04,
  ADD_MEMBER: 0x08,
  REMOVE_MEMBER: 0x16,
  CHANGE_MEMBER_PERMISSIONS: 0x32,
  CHANGE_MEMBER_NAME: 0x64,

  MEMBER: 0,
  OWNER: 0xffffffff,
};

/**
 *
 */
export class Seed implements Command {
  topic: Uint8Array | null;
  protocolVersion: number;
  groupKey: Uint8Array;
  initializationVector: Uint8Array;
  encryptedXpriv: Uint8Array;
  ephemeralPublicKey: Uint8Array;

  constructor(
    topic: Uint8Array | null,
    protocolVersion: number,
    groupKey: Uint8Array,
    initializationVector: Uint8Array,
    encryptedXpriv: Uint8Array,
    ephemerPublicKey: Uint8Array,
  ) {
    this.topic = topic;
    this.protocolVersion = protocolVersion;
    this.groupKey = groupKey.length == 0 ? new Uint8Array(33) : groupKey;
    this.initializationVector =
      initializationVector.length == 0 ? new Uint8Array(16) : initializationVector;
    this.encryptedXpriv = encryptedXpriv.length == 0 ? new Uint8Array(64) : encryptedXpriv;
    this.ephemeralPublicKey = ephemerPublicKey.length == 0 ? new Uint8Array(33) : ephemerPublicKey;
  }

  getType(): CommandType {
    return CommandType.Seed;
  }
}

/**
 *
 */
export class Derive implements Command {
  path: number[];
  groupKey: Uint8Array;
  initializationVector: Uint8Array;
  encryptedXpriv: Uint8Array;
  ephemeralPublicKey: Uint8Array;

  constructor(
    path: number[],
    groupKey: Uint8Array,
    initializationVector: Uint8Array,
    encryptedXpriv: Uint8Array,
    ephemeralPublicKey: Uint8Array,
  ) {
    this.path = path;
    this.groupKey = groupKey;
    this.initializationVector = initializationVector;
    this.encryptedXpriv = encryptedXpriv;
    this.ephemeralPublicKey = ephemeralPublicKey;
  }

  getType(): CommandType {
    return CommandType.Derive;
  }
}

/**
 *
 */
export class AddMember implements Command {
  name: string;
  publicKey: Uint8Array;
  permissions: number;

  constructor(name: string, publicKey: Uint8Array, permissions: number) {
    this.name = name;
    this.publicKey = publicKey;
    this.permissions = permissions;
  }

  getType(): CommandType {
    return CommandType.AddMember;
  }
}

/**
 *
 */
export class PublishKey implements Command {
  initializationVector: Uint8Array;
  encryptedXpriv: Uint8Array;
  recipient: Uint8Array;
  ephemeralPublicKey: Uint8Array;

  constructor(
    initializationVector: Uint8Array,
    encryptedXpriv: Uint8Array,
    recipient: Uint8Array,
    ephemeralPublicKey: Uint8Array,
  ) {
    this.encryptedXpriv = encryptedXpriv;
    this.initializationVector = initializationVector;
    this.recipient = recipient;
    this.ephemeralPublicKey = ephemeralPublicKey;
  }

  getType(): CommandType {
    return CommandType.PublishKey;
  }
}

/**
 *
 */
export class EditMember implements Command {
  member: Uint8Array;
  name: string | null;
  permissions: number | null;

  constructor(member: Uint8Array, name: string | null, permissions: number | null) {
    this.name = name;
    this.permissions = permissions;
    this.member = member;
  }

  getType(): CommandType {
    return CommandType.EditMember;
  }
}

/**
 *
 */
export class CloseStream implements Command {
  constructor() {}

  getType(): CommandType {
    return CommandType.CloseStream;
  }
}

/*
    Version   | VARINT  | 1     # Format version
    Parent    | HASH    | 32    # The hash of the parent command block (Random 32 bytes for the first command block)
    Issuer    | HASH    | 32    # Hash of the issuer public key
    Length    | VARINT  | 1     # Number of command in this command block
    ....
    Signature | SIG     | var   # Signature of the command block
*/
export interface CommandBlock {
  // The version of the command block format
  version: number;
  // The hash of the parent command block. For the first command block, parent must be a random 32 bytes number
  parent: Uint8Array;
  // The public key of the command block issuer
  issuer: Uint8Array;
  // The list of commands in this command block
  commands: Command[];
  // The signature of the command block
  signature: Uint8Array;
}

/**
 * Create a new command block.
 * @param issuer The public key of the command block issuer
 * @param commands The list of commands in this command block
 * @param signature The signature of the command block (by default the block is not signed)
 * @param parent The parent command block hash (if null, the block is the first block and a parent will be generated)
 * @returns
 */
export function createCommandBlock(
  issuer: Uint8Array,
  commands: Command[],
  signature: Uint8Array = new Uint8Array(),
  parent: Uint8Array | null = null,
): CommandBlock {
  if (parent === null) {
    parent = parent = crypto.randomBytes(32);
  }
  return {
    version: 1,
    issuer,
    parent,
    commands,
    signature,
  };
}

export function signCommandBlock(
  block: CommandBlock,
  issuer: Uint8Array,
  secretKey: Uint8Array,
): CommandBlock {
  const signature = crypto.sign(hashCommandBlock(block), crypto.keypairFromSecretKey(secretKey));
  return {
    ...block,
    signature,
  };
}

export function hashCommandBlock(block: CommandBlock): Uint8Array {
  return crypto.hash(CommandStreamEncoder.encode([block]));
}

export function verifyCommandBlock(block: CommandBlock): boolean {
  const unsignedBlock = { ...block };
  unsignedBlock.signature = new Uint8Array();
  const hash = hashCommandBlock(unsignedBlock);
  return crypto.verify(hash, block.signature, block.issuer);
}
