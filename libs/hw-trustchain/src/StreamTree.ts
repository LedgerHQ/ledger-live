import { CommandStream, Device } from ".";
import { DerivationPath } from "./Crypto";
import { IndexedTree } from "./IndexedTree";

/**
 *
 */
export interface ApplicationStreams {
  appStream: CommandStream;
  appRootStream: CommandStream;
}

/**
 *
 */
export interface StreamTreeCreateOpts {
  topic?: Uint8Array;
}

/**
 *
 */
export interface PublishKeyEvent {
  stream: CommandStream;
  encryptedXpriv: Uint8Array;
  groupPublicKey: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  nonce: Uint8Array;
}

/**
 *
 */
export class StreamTree {
  private tree: IndexedTree<CommandStream>;

  constructor(tree: IndexedTree<CommandStream>) {
    if (tree.getValue() === null) {
      throw new Error("Root of the tree cannot be null");
    }
    this.tree = tree;
  }

  public getApplicationRootPath(applicationId: number): string {
    // TODO implement with key rotation (currently always returns on roots 0h)
    const treeRoot = "0h"; // TODO change this
    const applicationRoot = "0h"; // TODO change this
    return `${treeRoot}/${applicationId}h/${applicationRoot}`;
  }

  public async getPublishKeyEvent(
    member: Uint8Array,
    path: number[],
  ): Promise<PublishKeyEvent | null> {
    // Iterate over the tree from leaf to root
    const leaf = this.tree.findChild(path);
    if (!leaf || leaf!.getValue() === null) {
      if (path.length === 0) {
        return null;
      }
      return this.getPublishKeyEvent(member, path.slice(0, path.length - 1));
    }
    const resolved = await leaf.getValue()!.resolve();
    const key = resolved.getEncryptedKey(member);
    if (!key) {
      if (path.length === 0) {
        return null;
      }
      return this.getPublishKeyEvent(member, path.slice(0, path.length - 1));
    }
    return {
      stream: leaf.getValue()!,
      encryptedXpriv: key.encryptedXpriv,
      ephemeralPublicKey: key.ephemeralPublicKey,
      nonce: key.initialiationVector,
      groupPublicKey: resolved.getGroupPublicKey(),
    };
  }

  public getChild(path: string | number[]): CommandStream | null {
    const indexes =
      typeof path === "string" ? DerivationPath.toIndexArray(path) : (path as number[]);
    const subtree = this.tree.findChild(indexes);
    if (subtree === undefined) {
      return null;
    }
    return subtree.getValue()!;
  }

  public getRoot(): CommandStream {
    return this.tree.getValue()!;
  }

  public createApplicationStreams(
    owner: Device,
    applicationId: number,
  ): Promise<ApplicationStreams> {
    owner as Device;
    applicationId as number;
    throw new Error("Not implemented");
  }

  /**
   * Share a private key with a member
   */
  public async share(
    path: string | number[],
    owner: Device,
    member: Uint8Array,
    name: string,
    permission: number,
  ): Promise<StreamTree> {
    const indexes =
      typeof path === "string" ? DerivationPath.toIndexArray(path) : (path as number[]);
    let stream = this.getChild(indexes) || new CommandStream();
    if (stream.blocks.length === 0 && indexes.length > 0) {
      const root = await this.getRoot().getRootHash();
      stream = await stream
        .edit()
        .derive(indexes)
        .addMember(name, member, permission, true)
        .issue(owner, this, root);
      return this.update(stream);
    } else if (stream.blocks.length === 0) {
      throw new Error(
        "StreamTree.share cannot add a member if the root was not previously created",
      );
    } else {
      const newStream = await stream.edit().addMember(name, member, permission).issue(owner, this);
      return this.update(newStream);
    }
  }

  public update(stream: CommandStream): StreamTree {
    const path = stream.getStreamPath();
    if (path === null) throw new Error("Stream path cannot be null");
    const indexes = DerivationPath.toIndexArray(path);
    const newTree = this.tree.updateChild(indexes, stream);
    return new StreamTree(newTree);
  }

  static async createNewTree(owner: Device, opts: StreamTreeCreateOpts = {}): Promise<StreamTree> {
    let stream = new CommandStream();
    stream = await stream.edit().seed(opts.topic).issue(owner);
    const tree = new IndexedTree(stream);
    return new StreamTree(tree);
  }

  static from(...streams: CommandStream[]): StreamTree {
    // Map all stream with their path
    const streamMap = new Map<string, CommandStream>();
    streams.forEach(stream => {
      const path = stream.getStreamPath();
      if (path === null) throw new Error("Stream path cannot be null");
      streamMap.set(path!, stream);
    });

    // Create tree if the list contains the root
    const root = streamMap.get("");
    if (root === undefined) throw new Error("StreamTree.from requires the root of the tree");
    let tree = new IndexedTree(root);
    streamMap.delete("");
    streamMap.forEach((stream, path) => {
      const p = DerivationPath.toIndexArray(path);
      tree = tree.addChild(p, new IndexedTree(stream));
    });
    return new StreamTree(tree);
  }
}
