import {
  Command,
  CommandBlock,
  CommandType,
  AddMember,
  Derive,
  EditMember,
  PublishKey,
  Seed,
} from "./CommandBlock";
import { Device } from "./Device";
import { PublicKey } from "./PublicKey";
import Transport from "@ledgerhq/hw-transport";
import { CommandStreamEncoder } from "./CommandStreamEncoder";
import { KeyPair, crypto } from "./Crypto";
import { StreamTree } from "./StreamTree";
import { TLV, TLVField } from "./tlv";
import { SeedIdResult, parseSeedIdResult } from "./SeedId";

export const TRUSTCHAIN_APP_NAME = "Ledger Sync";

enum ParseStreamMode {
  BlockHeader = 0x00,
  Command = 0x01,
  Signature = 0x02,
  Empty = 0x03,
}

enum OutputDataMode {
  None = 0x00,
  TrustedParam = 0x01,
}

const TP_ENCRYPT = 1 << 7;

enum TrustedPropertiesTLV {
  IV = 0x00,
  IssuerPublicKey = 0x01 | TP_ENCRYPT,
  Xpriv = 0x02 | TP_ENCRYPT,
  EphemeralPublicKey = 0x03,
  CommandIV = 0x04,
  GroupKey = 0x05,
  TrustedMember = 0x06 | TP_ENCRYPT,
}

interface TrustedMember {
  iv: Uint8Array;
  data: Uint8Array;
}

interface TrustedParams {
  members: Map<string, TrustedMember>;
  lastTrustedMember: string | undefined;
}

interface SignatureResponse {
  signature: Uint8Array;
  sessionKey: Uint8Array;
}

interface SignBlockHeaderResponse {
  iv: Uint8Array;
  issuer: Uint8Array;
}

interface SeedCommandResponse {
  iv: Uint8Array;
  xpriv: Uint8Array;
  commandIv: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  groupKey: Uint8Array;
  trustedMember: Uint8Array | null;
}

interface EmptyCommandResponse {}

interface AddMemberCommandResponse {
  iv: Uint8Array;
  trustedMember: Uint8Array;
}

interface PublishKeyCommandResponse {
  trustedMember: Uint8Array | null;
  iv: Uint8Array;
  xpriv: Uint8Array;
  commandIv: Uint8Array;
  ephemeralPublicKey: Uint8Array;
}

type CommandResponse =
  | SeedCommandResponse
  | AddMemberCommandResponse
  | PublishKeyCommandResponse
  | EmptyCommandResponse;

/**
 *
 */
export class APDU {
  static CLA = 0xe0;

  static INS_GET_PUBLIC_KEY = 0x05;
  static INS_PARSE_STREAM = 0x08;
  static INS_SIGN_BLOCK = 0x07;
  static INS_INIT = 0x06;
  static INS_SET_TRUSTED_MEMBER = 0x09;

  static async setTrustedMember(transport: Transport, member: TrustedMember): Promise<void> {
    const payload = new Uint8Array([
      TrustedPropertiesTLV.IV,
      member.iv.length,
      ...member.iv,
      TrustedPropertiesTLV.TrustedMember,
      member.data.length,
      ...member.data,
    ]);
    await transport.send(APDU.CLA, APDU.INS_SET_TRUSTED_MEMBER, 0, 0, Buffer.from(payload));
  }

  static async parseBlockHeader(transport: Transport, header: Uint8Array) {
    const result = await transport.send(
      APDU.CLA,
      APDU.INS_PARSE_STREAM,
      ParseStreamMode.BlockHeader,
      OutputDataMode.None,
      Buffer.from(header),
    );
    return APDU.getResponseData(result);
  }

  static async parseCommand(
    transport: Transport,
    command: Uint8Array,
    outputTrustedParam: boolean = false,
  ) {
    return await transport.send(
      APDU.CLA,
      APDU.INS_PARSE_STREAM,
      ParseStreamMode.Command,
      outputTrustedParam ? OutputDataMode.TrustedParam : OutputDataMode.None,
      Buffer.from(command),
    );
  }

  static async parseSignature(transport: Transport, signature: Uint8Array) {
    return await transport.send(
      APDU.CLA,
      APDU.INS_PARSE_STREAM,
      ParseStreamMode.Signature,
      OutputDataMode.None,
      Buffer.from(signature),
    );
  }

  static async initFlow(transport: Transport, sessionKey: Uint8Array): Promise<void> {
    await transport.send(APDU.CLA, APDU.INS_INIT, 0x00, 0x00, Buffer.from(sessionKey));
  }

  static async parseEmptyStream(transport: Transport): Promise<void> {
    await transport.send(
      APDU.CLA,
      APDU.INS_PARSE_STREAM,
      ParseStreamMode.Empty,
      OutputDataMode.None,
      Buffer.alloc(0),
    );
  }

  static async signBlockHeader(
    transport: Transport,
    header: Uint8Array,
  ): Promise<SignBlockHeaderResponse> {
    const data = await transport.send(
      APDU.CLA,
      APDU.INS_SIGN_BLOCK,
      ParseStreamMode.BlockHeader,
      OutputDataMode.None,
      Buffer.from(header),
    );
    const resp = APDU.getResponseData(data);
    const tlvs = TLV.readAllTLV(resp, 0);
    let iv: Uint8Array | null = null;
    let issuer: Uint8Array | null = null;
    for (const tlv of tlvs) {
      if (tlv.type === TrustedPropertiesTLV.IV) {
        iv = tlv.value;
      }
      if (tlv.type === TrustedPropertiesTLV.IssuerPublicKey) {
        issuer = tlv.value;
      }
    }
    if (iv === null) {
      throw new Error("No IV in response");
    }
    if (issuer === null) {
      throw new Error("No issuer in response");
    }
    return { iv, issuer };
  }

  static async signCommand(transport: Transport, command: Uint8Array): Promise<Uint8Array> {
    const data = await transport.send(
      APDU.CLA,
      APDU.INS_SIGN_BLOCK,
      ParseStreamMode.Command,
      OutputDataMode.None,
      Buffer.from(command),
    );
    return APDU.getResponseData(data);
  }

  static async finalizeSignature(transport: Transport): Promise<SignatureResponse> {
    const response = await transport.send(
      APDU.CLA,
      APDU.INS_SIGN_BLOCK,
      ParseStreamMode.Signature,
      OutputDataMode.None,
      Buffer.alloc(0),
    );
    const data = APDU.getResponseData(response);
    const sigLen = data[0];
    const signature = data.slice(1, sigLen + 1);
    const sessionKey = data.slice(sigLen + 2);

    return { signature, sessionKey };
  }

  static async getPublicKey(transport: Transport): Promise<Uint8Array> {
    const response = await transport.send(
      APDU.CLA,
      APDU.INS_GET_PUBLIC_KEY,
      0x00,
      0x00,
      Buffer.alloc(0),
    );
    return APDU.getResponseData(response);
  }

  /**
   * allows to sign a challenge and get the seed id
   */
  static async getSeedId(transport: Transport, challenge: Uint8Array): Promise<SeedIdResult> {
    const response = await transport.send(
      APDU.CLA,
      APDU.INS_GET_PUBLIC_KEY,
      0x00,
      0x00,
      Buffer.from(challenge),
    );
    const result = parseSeedIdResult(APDU.getResponseData(response));
    return result;
  }

  static getResponseData(response: Buffer): Uint8Array {
    return Uint8Array.prototype.slice.call(response, 0, response.length - 2);
  }

  static getStatusWord(response: Buffer): number {
    return response.readUInt16BE(response.length - 2);
  }

  static parseTrustedSeed(tlvs: TLVField[]): SeedCommandResponse {
    let iv: Uint8Array | null = null;
    let xpriv: Uint8Array | null = null;
    let ephemeralPublicKey: Uint8Array | null = null;
    let commandIv: Uint8Array | null = null;
    let groupKey: Uint8Array | null = null;
    let trustedMember: Uint8Array | null = null;

    for (const tlv of tlvs) {
      switch (tlv.type) {
        case TrustedPropertiesTLV.IV:
          iv = tlv.value;
          break;
        case TrustedPropertiesTLV.Xpriv:
          xpriv = tlv.value;
          break;
        case TrustedPropertiesTLV.EphemeralPublicKey:
          ephemeralPublicKey = tlv.value;
          break;
        case TrustedPropertiesTLV.CommandIV:
          commandIv = tlv.value;
          break;
        case TrustedPropertiesTLV.GroupKey:
          groupKey = tlv.value;
          break;
        case TrustedPropertiesTLV.TrustedMember:
          trustedMember = tlv.value;
          break;
        default:
          throw new Error("Unknown trusted property");
      }
    }
    if (iv === null) {
      throw new Error("No IV in response");
    }
    if (xpriv === null) {
      throw new Error("No xpriv in response");
    }
    if (ephemeralPublicKey === null) {
      throw new Error("No ephemeral public key in response");
    }
    if (commandIv === null) {
      throw new Error("No command IV in response");
    }
    if (groupKey === null) {
      throw new Error("No group key in response");
    }
    return { iv, xpriv, ephemeralPublicKey, commandIv, groupKey, trustedMember };
  }

  static parseTrustedAddMember(tlvs: TLVField[]): AddMemberCommandResponse {
    let iv: Uint8Array | null = null;
    let trustedMember: Uint8Array | null = null;
    for (const tlv of tlvs) {
      if (tlv.type === TrustedPropertiesTLV.TrustedMember) {
        trustedMember = tlv.value;
      } else if (tlv.type === TrustedPropertiesTLV.IV) {
        iv = tlv.value;
      }
    }
    if (iv === null) {
      throw new Error("No IV in response");
    }
    if (trustedMember === null) {
      throw new Error("No trusted member in response");
    }
    return { trustedMember, iv };
  }

  static parseTrustedPublishKey(tlvs: TLVField[]): PublishKeyCommandResponse {
    let iv: Uint8Array | null = null;
    let ephemeralPublicKey: Uint8Array | null = null;
    let commandIv: Uint8Array | null = null;
    let trustedMember: Uint8Array | null = null;
    let xpriv: Uint8Array | null = null;

    for (const tlv of tlvs) {
      switch (tlv.type) {
        case TrustedPropertiesTLV.IV:
          iv = tlv.value;
          break;
        case TrustedPropertiesTLV.EphemeralPublicKey:
          ephemeralPublicKey = tlv.value;
          break;
        case TrustedPropertiesTLV.CommandIV:
          commandIv = tlv.value;
          break;
        case TrustedPropertiesTLV.TrustedMember:
          trustedMember = tlv.value;
          break;
        case TrustedPropertiesTLV.Xpriv:
          xpriv = tlv.value;
          break;
        default:
          continue;
      }
    }
    if (iv === null) {
      throw new Error("No IV in response");
    }
    if (ephemeralPublicKey === null) {
      throw new Error("No ephemeral public key in response");
    }
    if (commandIv === null) {
      throw new Error("No command IV in response");
    }
    if (xpriv === null) {
      throw new Error("No xpriv in response");
    }
    return { iv, ephemeralPublicKey, commandIv, trustedMember, xpriv };
  }

  static parseTrustedProperties(command: Command, rawProperties: Uint8Array): CommandResponse {
    const tlvs = TLV.readAllTLV(rawProperties, 0);
    switch (command.getType()) {
      case CommandType.Derive:
      case CommandType.Seed:
        return APDU.parseTrustedSeed(tlvs);
      case CommandType.AddMember:
        return APDU.parseTrustedAddMember(tlvs);
      case CommandType.PublishKey:
        return APDU.parseTrustedPublishKey(tlvs);
      case CommandType.CloseStream:
        return {};
      default:
        throw new Error("Unsupported command type");
    }
  }
}

function injectTrustedProperties(
  command: Command,
  properties: CommandResponse,
  secret: Uint8Array,
): Command {
  switch (command.getType()) {
    case CommandType.Seed: {
      const seedCommand = command as Seed;
      const seedProperties = properties as SeedCommandResponse;
      seedCommand.encryptedXpriv = crypto.decrypt(secret, seedProperties.iv, seedProperties.xpriv);
      seedCommand.ephemeralPublicKey = seedProperties.ephemeralPublicKey;
      seedCommand.initializationVector = seedProperties.commandIv;
      seedCommand.groupKey = seedProperties.groupKey;
      return seedCommand;
    }
    case CommandType.Derive: {
      const deriveCommand = command as Derive;
      const deriveProperties = properties as SeedCommandResponse;
      deriveCommand.encryptedXpriv = crypto.decrypt(
        secret,
        deriveProperties.iv,
        deriveProperties.xpriv,
      );
      deriveCommand.ephemeralPublicKey = deriveProperties.ephemeralPublicKey;
      deriveCommand.initializationVector = deriveProperties.commandIv;
      deriveCommand.groupKey = deriveProperties.groupKey;
      return deriveCommand;
    }
    case CommandType.AddMember:
      return command; // No properties to inject
    case CommandType.PublishKey: {
      const publishKeyCommand = command as PublishKey;
      const publishKeyProperties = properties as PublishKeyCommandResponse;
      publishKeyCommand.ephemeralPublicKey = publishKeyProperties.ephemeralPublicKey;
      publishKeyCommand.initializationVector = publishKeyProperties.commandIv;
      publishKeyCommand.encryptedXpriv = crypto.decrypt(
        secret,
        publishKeyProperties.iv,
        publishKeyProperties.xpriv,
      );
      return publishKeyCommand;
    }
    case CommandType.CloseStream:
      return command; // No properties to inject
    default:
      throw new Error("Unsupported command type");
  }
}

function findTrustedMember(params: TrustedParams, member: Uint8Array): TrustedMember | null {
  return params.members.get(crypto.to_hex(member)) || null;
}
findTrustedMember;

export class ApduDevice implements Device {
  private transport: Transport;
  private sessionKeyPair: KeyPair;

  constructor(transport: Transport) {
    this.transport = transport;
    this.sessionKeyPair = crypto.randomKeypair();
  }

  isPublicKeyAvailable(): boolean {
    return false;
  }

  async getPublicKey(): Promise<PublicKey> {
    const publicKey = await APDU.getPublicKey(this.transport);
    return new PublicKey(publicKey);
  }

  getSeedId(data: Uint8Array): Promise<SeedIdResult> {
    return APDU.getSeedId(this.transport, data);
  }

  private assertStreamIsValid(stream: CommandBlock[]) {
    const blockToSign = stream.filter(block => block.signature.length == 0).length;
    if (blockToSign !== 1)
      throw new Error(
        "Stream must contain exactly one block to sign. Found " + blockToSign + " blocks to sign.",
      );
  }

  private recordTrustedMember(
    trustedParams: TrustedParams,
    publicKey: Uint8Array,
    responseData: Uint8Array,
  ) {
    // Parse an APDU result as TLV and find IV and trusted member data.
    // The data is then assigned to a public key. The parsing must set the
    // public key depending on the current step in the flow (e.g add member
    // will issue a trusted member for the added member)
    const tlvs = TLV.readAllTLV(responseData, 0);
    let member: Uint8Array | null = null;
    let iv: Uint8Array | null = null;

    if (publicKey.length == 0 || (publicKey[0] != 0x02 && publicKey[0] != 0x03)) {
      // The public key is not set if it's the device itself
      return;
    }

    for (const tlv of tlvs) {
      if (tlv.type == TrustedPropertiesTLV.TrustedMember) {
        member = tlv.value;
      }
      if (tlv.type == TrustedPropertiesTLV.IV) {
        iv = tlv.value;
      }
    }
    if (member === null || iv === null) {
      return; // Do nothing trusted member is optional in some cases
      // (e.g. if the trusted member is the device itself)
    }
    trustedParams.members.set(crypto.to_hex(publicKey), { iv, data: member });
    // Set the last trusted member. This is used to prevent sending the same current trusted member
    // to the device again.
    trustedParams.lastTrustedMember = crypto.to_hex(publicKey);
  }

  private hasTrustedMember(trustedParams: TrustedParams, publicKey: Uint8Array): boolean {
    return trustedParams.members.has(crypto.to_hex(publicKey));
  }

  // Throws if the trusted member is not found
  private getTrustedMember(trustedParams: TrustedParams, publicKey: Uint8Array): TrustedMember {
    const member = trustedParams.members.get(crypto.to_hex(publicKey));
    if (member === undefined) {
      throw new Error("Trusted member not found");
    }
    return member;
  }

  // Set the trusted member on the device if it's not already set
  private async setTrustedMember(params: TrustedParams, publicKey: Uint8Array): Promise<void> {
    // Check if the trusted member is already set on device
    if (params.lastTrustedMember == crypto.to_hex(publicKey)) {
      return;
    }

    // Verify we actually have the trusted member
    if (this.hasTrustedMember(params, publicKey) == false) {
      return;
    }
    // console.log("Setting trusted member: ", crypto.to_hex(publicKey));
    return APDU.setTrustedMember(this.transport, this.getTrustedMember(params, publicKey));
  }

  private async parseBlock(block: CommandBlock, trustedParams: TrustedParams): Promise<void> {
    let result: Uint8Array;

    // Parse the block header
    await this.setTrustedMember(trustedParams, block.issuer);
    result = await APDU.parseBlockHeader(
      this.transport,
      CommandStreamEncoder.encodeBlockHeader(block),
    );
    // Record potential trusted member
    this.recordTrustedMember(trustedParams, block.issuer, result);
    for (const index in block.commands) {
      // Parse the command
      const command = block.commands[index];

      // Set the trusted member depending on the command
      switch (command.getType()) {
        case CommandType.AddMember:
          await this.setTrustedMember(trustedParams, block.issuer);
          break;
        case CommandType.PublishKey:
          await this.setTrustedMember(trustedParams, (command as PublishKey).recipient);
          break;
        case CommandType.EditMember:
          await this.setTrustedMember(trustedParams, (command as EditMember).member);
          break;
        default:
          // Do nothing
          break;
      }
      result = await APDU.parseCommand(
        this.transport,
        CommandStreamEncoder.encodeCommand(block, parseInt(index)),
        true,
      );
      // Record potential trusted member
      switch (command.getType()) {
        case CommandType.Seed:
          this.recordTrustedMember(trustedParams, block.issuer, result);
          break;
        case CommandType.AddMember:
          this.recordTrustedMember(trustedParams, (command as AddMember).publicKey, result);
          break;
        case CommandType.PublishKey:
          this.recordTrustedMember(trustedParams, (command as PublishKey).recipient, result);
          break;
        case CommandType.Derive:
          this.recordTrustedMember(trustedParams, block.issuer, result);
          break;
        case CommandType.EditMember:
          this.recordTrustedMember(trustedParams, (command as EditMember).member, result);
          break;
      }
    }
    // Parse the block signature
    await APDU.parseSignature(this.transport, CommandStreamEncoder.encodeSignature(block));
  }

  private async parseStream(stream: CommandBlock[]): Promise<TrustedParams> {
    const trustedParams: TrustedParams = {
      members: new Map<string, TrustedMember>(),
      lastTrustedMember: undefined,
    };
    if (stream.length == 0) {
      await APDU.parseEmptyStream(this.transport);
    }
    for (const block of stream.slice(0, stream.length - 1)) {
      await this.parseBlock(block, trustedParams);
    }
    return trustedParams;
  }

  async sign(stream: CommandBlock[]): Promise<CommandBlock> {
    const sessionKey = this.sessionKeyPair;
    const trustedProperties: CommandResponse[] = [];

    // We expect the stream to have a single block to sign (the last one)
    this.assertStreamIsValid(stream);

    // Init signature flow
    await APDU.initFlow(this.transport, sessionKey.publicKey);

    // Before signing we need to parse the stream on device and get trusted params
    const trustedParams = await this.parseStream(stream);
    trustedParams;

    // Create the new block to sign
    const blockToSign = stream[stream.length - 1];
    const trustedIssuer = await APDU.signBlockHeader(
      this.transport,
      CommandStreamEncoder.encodeBlockHeader(blockToSign),
    );

    // Pass all commands to device
    for (let commandIndex = 0; commandIndex < blockToSign.commands.length; commandIndex++) {
      // Pass the trusted param allowing the command to the device
      // If we have no trusted param we need an explicit approval
      const tp = await APDU.signCommand(
        this.transport,
        CommandStreamEncoder.encodeCommand(blockToSign, commandIndex),
      );
      trustedProperties.push(APDU.parseTrustedProperties(blockToSign.commands[commandIndex], tp));
    }

    // Finalize block signature
    const signature = await APDU.finalizeSignature(this.transport);

    // Decrypt and inject trusted issuer
    const secret = crypto.ecdh(sessionKey, signature.sessionKey);
    const issuer = crypto.decrypt(secret, trustedIssuer.iv, trustedIssuer.issuer);

    // Inject trusted properties for commands
    for (let commandIndex = 0; commandIndex < blockToSign.commands.length; commandIndex++) {
      blockToSign.commands[commandIndex] = await injectTrustedProperties(
        blockToSign.commands[commandIndex],
        trustedProperties[commandIndex],
        secret,
      );
    }
    blockToSign.issuer = issuer;
    blockToSign.signature = signature.signature;
    return blockToSign;
  }

  async readKey(tree: StreamTree, path: number[]): Promise<Uint8Array> {
    tree as StreamTree;
    path as number[];
    throw new Error("readKey is not supported on hardware devices");
  }

  async isConnected(): Promise<boolean> {
    const response = await this.transport.send(0xe0, 0x04, 0x00, 0x00);
    const sw = response.readUInt16BE(response.length - 2);
    if (sw !== 0x9000) return false;
    const appName = response.subarray(0, response.length - 2).toString();
    return appName === TRUSTCHAIN_APP_NAME;
  }

  async close(): Promise<void> {
    await this.transport.close();
  }
}

/**
 *
 */
export function createApduDevice(transport: Transport): ApduDevice {
  return new ApduDevice(transport);
}
