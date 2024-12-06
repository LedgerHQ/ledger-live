import {
  CommandBlock,
  Command,
  createCommandBlock,
  hashCommandBlock,
  CommandType,
  Seed,
  Derive,
  AddMember,
  PublishKey,
  CloseStream,
} from "./CommandBlock";
import CommandStreamResolver, { ResolvedCommandStream } from "./CommandStreamResolver";
import { DerivationPath } from "./Crypto";
import { Device, ISSUER_PLACEHOLDER } from "./Device";
import { StreamTree } from "./StreamTree";

const EMPTY = new Uint8Array();

/**
 *
 */
export type CommandIssuer = (
  device: Device,
  tempStream: CommandStream,
  streamTree?: StreamTree | null,
) => Promise<Command[]>;

/**
 *
 */
export class CommandStreamIssuer {
  private _stream: CommandStream;
  private _steps: CommandIssuer[] = [];

  constructor(stream: CommandStream) {
    this._stream = stream;
  }

  public seed(topic: Uint8Array | null = null): CommandStreamIssuer {
    const step: CommandIssuer = async (
      device: Device,
      tempStream: CommandStream,
      streamTree?: StreamTree | null,
    ) => {
      device as Device;
      tempStream as CommandStream;
      streamTree as StreamTree;
      return [new Seed(topic, 0, EMPTY, EMPTY, EMPTY, EMPTY)];
    };
    this._steps.push(step);
    return this;
  }

  public derive(path: number[]): CommandStreamIssuer {
    const step: CommandIssuer = async (
      device: Device,
      tempStream: CommandStream,
      streamTree?: StreamTree | null,
    ) => {
      device as Device;
      tempStream as CommandStream;
      streamTree as StreamTree;
      const derivationPath = DerivationPath.toIndexArray(path);
      return [new Derive(derivationPath, EMPTY, EMPTY, EMPTY, EMPTY)];
    };
    this._steps.push(step);
    return this;
  }

  public addMember(
    name: string,
    publicKey: Uint8Array,
    permissions: number,
    publishKey: boolean = true,
  ): CommandStreamIssuer {
    const step: CommandIssuer = async (
      device: Device,
      tempStream: CommandStream,
      streamTree?: StreamTree | null,
    ) => {
      device as Device;
      tempStream as CommandStream;
      streamTree as StreamTree;
      if (publishKey) {
        return [
          new AddMember(name, publicKey, permissions),
          new PublishKey(EMPTY, EMPTY, publicKey, EMPTY),
        ];
      } else {
        return [new AddMember(name, publicKey, permissions)];
      }
    };
    this._steps.push(step);
    return this;
  }

  public publishKey(publicKey: Uint8Array): CommandStreamIssuer {
    const step: CommandIssuer = async (
      device: Device,
      tempStream: CommandStream,
      streamTree?: StreamTree | null,
    ) => {
      device as Device;
      tempStream as CommandStream;
      streamTree as StreamTree;
      return [new PublishKey(EMPTY, EMPTY, publicKey, EMPTY)];
    };
    this._steps.push(step);
    return this;
  }

  public close(): CommandStreamIssuer {
    const step: CommandIssuer = async (
      device: Device,
      tempStream: CommandStream,
      streamTree?: StreamTree | null,
    ) => {
      device as Device;
      tempStream as CommandStream;
      streamTree as StreamTree;
      return [new CloseStream()];
    };
    this._steps.push(step);
    return this;
  }

  public async issue(
    device: Device,
    streamTree?: StreamTree | null,
    parentHash?: Uint8Array | null,
  ): Promise<CommandStream> {
    const lastBlockHash =
      this._stream.blocks.length > 0
        ? hashCommandBlock(this._stream.blocks[this._stream.blocks.length - 1])
        : null;
    const block = createCommandBlock(
      ISSUER_PLACEHOLDER,
      [],
      new Uint8Array(),
      parentHash || lastBlockHash,
    );
    const stream = new CommandStream(this._stream.blocks.concat([]));
    const tempStream = new CommandStream(this._stream.blocks.concat([block]));
    let commands: Command[] = [];
    for (const step of this._steps) {
      const newCommands = await step(device, tempStream, streamTree);
      commands = commands.concat(newCommands);
      tempStream.blocks[tempStream.blocks.length - 1].commands = commands;
    }
    return await stream.issue(device, commands, streamTree, parentHash);
  }
}

/**
 *
 */
export default class CommandStream {
  private _blocks: CommandBlock[] = [];

  constructor(blocks: CommandBlock[] = []) {
    this._blocks = blocks;
  }

  public resolve(incomplete: boolean = false): Promise<ResolvedCommandStream> {
    incomplete as boolean;
    return CommandStreamResolver.resolve(this._blocks);
  }

  public getRootHash(): Uint8Array {
    return hashCommandBlock(this._blocks[0]);
  }

  public getStreamPath(): string | null {
    if (this._blocks.length === 0) return null;
    if (this._blocks[0].commands[0].getType() === CommandType.Seed) {
      return "";
    } else if (this._blocks[0].commands[0].getType() === CommandType.Derive) {
      return DerivationPath.toString((this._blocks[0].commands[0] as Derive).path);
    } else {
      throw new Error("Malformed CommandStream");
    }
  }

  public async push(
    block: CommandBlock,
    issuer: Device,
    tree: StreamTree | null,
  ): Promise<CommandStream> {
    let stream: CommandBlock[] = [];

    if (block.commands.length === 0) {
      throw new Error("Attempts to create an empty block");
    }

    // If the first command of the new block is not a seed and the first command of the stream is not a seed either, prepend the root block

    if (
      (this._blocks.length == 0 || this._blocks[0].commands[0].getType() !== CommandType.Seed) &&
      block.commands[0].getType() !== CommandType.Seed
    ) {
      const root = tree?.getRoot();
      if (!root || root.blocks.length === 0) {
        throw new Error("Null or empty tree cannot be used to sign the new block");
      }
      stream = [root.blocks[0]].concat(this._blocks);
    } else {
      stream = this._blocks;
    }

    if (block.commands[0].getType() === CommandType.Derive) {
      // Set the parent hash of the block to the root hash
      const b = { ...block };
      b.parent = hashCommandBlock(stream[0]);
      stream = stream.concat([b]);
    } else {
      stream = stream.concat([block]);
    }
    const signedBlock = await issuer.sign(stream, tree || undefined);
    return new CommandStream(this._blocks.concat([signedBlock]));
  }

  public async issue(
    device: Device,
    commands: Command[],
    tree: StreamTree | null = null,
    parentHash: Uint8Array | null = null,
  ): Promise<CommandStream> {
    const lastBlockHash =
      this._blocks.length > 0 ? hashCommandBlock(this._blocks[this._blocks.length - 1]) : null;
    const block = createCommandBlock(
      ISSUER_PLACEHOLDER,
      commands,
      new Uint8Array(),
      parentHash || lastBlockHash,
    );
    return this.push(block, device, tree);
  }

  public edit(): CommandStreamIssuer {
    return new CommandStreamIssuer(this);
  }

  public async getStreamPublicKey(): Promise<Uint8Array> {
    // Group public must be the first command in the first block othwerwise it is malformed
    if (this._blocks.length === 0 || this._blocks[0].commands.length === 0)
      throw new Error("Empty CommandStream");
    if (this._blocks[0].commands[0].getType() === CommandType.Seed) {
      return (this._blocks[0].commands[0] as Seed).groupKey;
    }
    if (this._blocks[0].commands[0].getType() === CommandType.Derive) {
      return (this._blocks[0].commands[0] as Derive).groupKey;
    }
    throw new Error("Malformed CommandStream");
  }

  get blocks(): CommandBlock[] {
    return this._blocks;
  }
}
