import { CommandStream, CommandStreamDecoder, CommandStreamEncoder, Device } from ".";
import { crypto, DerivationPath } from "./Crypto";
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

  public getApplicationRootPath(applicationId: number, increment: number = 0): string {
    // tree index is always 0 in the current implementation
    const treeIndex = 0;
    // for application index, we have key rotation that is possible so we need to find the last index
    const child = this.tree
      .getChild(DerivationPath.hardenedIndex(treeIndex))
      ?.getChild(DerivationPath.hardenedIndex(applicationId));
    const applicationIndex = child
      ? DerivationPath.reverseHardenedIndex(child.getHighestIndex())
      : 0;
    return `m/${treeIndex}'/${applicationId}'/${applicationIndex + increment}'`;
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

  /**
   * Enumerate the current (highest index) stream of each application branch
   * derived under the tree root (m/{treeIndex}'/{applicationId}'/{index}').
   * Used to decide, on deactivation, whether the application being closed is
   * the last open one of the trustchain.
   */
  public getApplicationStreams(): {
    applicationId: number;
    index: number;
    stream: CommandStream;
  }[] {
    // tree index is always 0 in the current implementation
    const treeIndex = 0;
    const applicationsNode = this.tree.getChild(DerivationPath.hardenedIndex(treeIndex));
    if (!applicationsNode) return [];
    const result: { applicationId: number; index: number; stream: CommandStream }[] = [];
    for (const [applicationHardened, applicationNode] of applicationsNode.getChildren()) {
      const highestIndex = applicationNode.getHighestIndex();
      const stream = applicationNode.getChild(highestIndex)?.getValue();
      if (stream) {
        result.push({
          applicationId: DerivationPath.reverseHardenedIndex(applicationHardened),
          index: DerivationPath.reverseHardenedIndex(highestIndex),
          stream,
        });
      }
    }
    return result;
  }

  /**
   * Returns true if an application other than `applicationId` still has an open (not closed) stream.
   * Stops at the first open application found. A stream that fails to resolve is treated as open, so an
   * unrelated broken application never causes the caller to destroy the whole trustchain on uncertainty.
   */
  public async hasAnotherOpenApplication(applicationId: number): Promise<boolean> {
    for (const application of this.getApplicationStreams()) {
      if (application.applicationId === applicationId) continue;
      try {
        if (!(await application.stream.resolve()).isClosed()) return true;
      } catch {
        return true;
      }
    }
    return false;
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

  /**
   * Close a stream
   */
  public async close(path: string | number[], owner: Device): Promise<StreamTree> {
    const indexes =
      typeof path === "string" ? DerivationPath.toIndexArray(path) : (path as number[]);
    let stream = this.getChild(indexes) || new CommandStream();
    stream = await stream.edit().close().issue(owner, this);
    return this.update(stream);
  }

  public update(stream: CommandStream): StreamTree {
    const path = stream.getStreamPath();

    if (path === null) throw new Error("Stream path cannot be null");
    const indexes = DerivationPath.toIndexArray(path);
    const newTree = this.tree.updateChild(indexes, stream);

    return new StreamTree(newTree);
  }

  public serialize(): Record<string, string> {
    const streamEntries = serializeTree(this.tree, []);
    const entries = streamEntries.flatMap(([path, stream]) =>
      stream ? [[path, crypto.to_hex(CommandStreamEncoder.encode(stream.blocks))]] : [],
    );
    return Object.fromEntries(entries);

    function serializeTree(
      tree: IndexedTree<CommandStream>,
      path: number[],
    ): [string, CommandStream | null][] {
      const stream = tree.getValue();
      const childrens = tree.getChildren();

      return [
        [DerivationPath.toString(path), stream],
        ...Array.from(childrens.entries()).flatMap(([index, child]) =>
          serializeTree(child, [...path, index]),
        ),
      ];
    }
  }

  static deserialize(data: Record<string, string>): StreamTree {
    const streams = Object.values(data).map(
      data => new CommandStream(CommandStreamDecoder.decode(crypto.from_hex(data))),
    );
    return StreamTree.from(...streams);
  }

  static async createNewTree(owner: Device, opts: StreamTreeCreateOpts = {}): Promise<StreamTree> {
    let stream = new CommandStream();
    const streamToIssue = stream.edit().seed(opts.topic);

    stream = await streamToIssue.issue(owner);

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
