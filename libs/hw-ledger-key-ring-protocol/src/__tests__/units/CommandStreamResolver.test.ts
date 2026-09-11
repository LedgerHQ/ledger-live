// Blocks are forged rather than produced by CommandStream.edit(): an attacker controlling the
// backend is not bound to the SDK helpers, only to producing a signed and correctly chained block.

import { SoftwareDevice } from "../..";
import {
  AddMember,
  CloseStream,
  Command,
  CommandBlock,
  createCommandBlock,
  Derive,
  hashCommandBlock,
  Permissions,
  PublishKey,
  Seed,
  signCommandBlock,
} from "../../CommandBlock";
import CommandStream from "../../CommandStream";
import { crypto, DerivationPath, KeyPair } from "../../Crypto";
import { StreamTree } from "../../StreamTree";

const APPLICATION_ID = 16;

function member() {
  const keyPair = crypto.randomKeypair();
  return { keyPair, device: new SoftwareDevice(keyPair), publicKey: keyPair.publicKey };
}

function forgeBlock(issuer: KeyPair, commands: Command[], parent: Uint8Array): CommandBlock {
  const block = createCommandBlock(issuer.publicKey, commands, new Uint8Array(), parent);
  return signCommandBlock(block, issuer.publicKey, issuer.privateKey);
}

function appendForgedBlock(stream: CommandStream, issuer: KeyPair, commands: Command[]) {
  const parent = hashCommandBlock(stream.blocks[stream.blocks.length - 1]);
  return new CommandStream(stream.blocks.concat([forgeBlock(issuer, commands, parent)]));
}

function forgedDerive(path: string): Derive {
  return new Derive(
    DerivationPath.toIndexArray(path),
    crypto.randomKeypair().publicKey,
    crypto.randomBytes(16),
    crypto.randomBytes(64),
    crypto.randomKeypair().publicKey,
  );
}

function forgedSeed(): Seed {
  return new Seed(
    null,
    0,
    crypto.randomKeypair().publicKey,
    crypto.randomBytes(16),
    crypto.randomBytes(64),
    crypto.randomKeypair().publicKey,
  );
}

async function createApplicationTree(owner: SoftwareDevice) {
  const tree = await StreamTree.createNewTree(owner);
  return { tree, path: tree.getApplicationRootPath(APPLICATION_ID) };
}

describe("CommandStreamResolver membership gate", () => {
  it("rejects a block issued by a valid public key that is not a member", async () => {
    const alice = member();
    const attacker = member();
    const tree = await StreamTree.createNewTree(alice.device);

    // 33 bytes compressed point, indistinguishable from a member key by length alone
    expect(attacker.publicKey.length).toBe(alice.publicKey.length);

    const tampered = appendForgedBlock(tree.getRoot(), attacker.keyPair, [new CloseStream()]);

    await expect(tampered.resolve()).rejects.toThrow(/not part of the group/);
  });

  it("does not let a non member take ownership through a Derive block and add itself", async () => {
    const alice = member();
    const attacker = member();
    const tree = await StreamTree.createNewTree(alice.device);

    const tampered = appendForgedBlock(tree.getRoot(), attacker.keyPair, [
      forgedDerive(`m/0'/${APPLICATION_ID}'/0'`),
      new AddMember("Attacker", attacker.publicKey, Permissions.OWNER),
    ]);

    await expect(tampered.resolve()).rejects.toThrow(/not part of the group/);
  });

  it("does not let a non member re-seed the stream", async () => {
    const alice = member();
    const attacker = member();
    const tree = await StreamTree.createNewTree(alice.device);

    const tampered = appendForgedBlock(tree.getRoot(), attacker.keyPair, [forgedSeed()]);

    await expect(tampered.resolve()).rejects.toThrow(/not part of the group/);
  });

  it("does not let a non member publish the group key to itself", async () => {
    const alice = member();
    const attacker = member();
    const tree = await StreamTree.createNewTree(alice.device);

    const tampered = appendForgedBlock(tree.getRoot(), attacker.keyPair, [
      new PublishKey(
        crypto.randomBytes(16),
        crypto.randomBytes(64),
        attacker.publicKey,
        crypto.randomKeypair().publicKey,
      ),
    ]);

    await expect(tampered.resolve()).rejects.toThrow(/not part of the group/);
  });

  it("rejects a non member on a derived application stream", async () => {
    const alice = member();
    const bob = member();
    const attacker = member();

    let { tree, path } = await createApplicationTree(alice.device);
    tree = await tree.share(path, alice.device, bob.publicKey, "Bob", Permissions.OWNER);

    const tampered = appendForgedBlock(tree.getChild(path)!, attacker.keyPair, [
      new AddMember("Attacker", attacker.publicKey, Permissions.OWNER),
    ]);

    await expect(tampered.resolve()).rejects.toThrow(/not part of the group/);
  });
});

describe("CommandStreamResolver stream creation gate", () => {
  it("does not let a member without ownership escalate through a Derive block", async () => {
    const alice = member();
    const bob = member();
    const attacker = member();

    let { tree, path } = await createApplicationTree(alice.device);
    tree = await tree.share(path, alice.device, bob.publicKey, "Bob", Permissions.MEMBER);

    const tampered = appendForgedBlock(tree.getChild(path)!, bob.keyPair, [
      forgedDerive(`m/0'/${APPLICATION_ID}'/0'`),
      new AddMember("Attacker", attacker.publicKey, Permissions.OWNER),
    ]);

    await expect(tampered.resolve()).rejects.toThrow(/not allowed to derive/);
  });

  it("does not let a member without ownership escalate through a Seed block", async () => {
    const alice = member();
    const bob = member();

    let { tree, path } = await createApplicationTree(alice.device);
    tree = await tree.share(path, alice.device, bob.publicKey, "Bob", Permissions.MEMBER);

    const tampered = appendForgedBlock(tree.getChild(path)!, bob.keyPair, [forgedSeed()]);

    await expect(tampered.resolve()).rejects.toThrow(/not allowed to seed/);
  });

  it("still allows an owner to derive, which the signing path relies on", async () => {
    const alice = member();
    const tree = await StreamTree.createNewTree(alice.device);

    // CommandStream.push prepends the root block, so SoftwareDevice.sign resolves [seed, derive, ...]
    const prepended = appendForgedBlock(tree.getRoot(), alice.keyPair, [
      forgedDerive(`m/0'/${APPLICATION_ID}'/0'`),
    ]);

    await expect(prepended.resolve()).resolves.toBeDefined();
  });
});

describe("CommandStreamResolver legitimate flows", () => {
  it("resolves a tree shared with two members", async () => {
    const alice = member();
    const bob = member();
    const carol = member();

    let { tree, path } = await createApplicationTree(alice.device);
    tree = await tree.share(path, alice.device, bob.publicKey, "Bob", Permissions.OWNER);
    tree = await tree.share(path, bob.device, carol.publicKey, "Carol", Permissions.OWNER);

    const resolved = await tree.getChild(path)!.resolve();
    expect(resolved.isCreated()).toBe(true);
    expect(resolved.getMembersData().map(m => m.name)).toEqual(["Bob", "Carol"]);
    expect(resolved.getMembers().map(k => crypto.to_hex(k))).toEqual([
      crypto.to_hex(alice.publicKey),
      crypto.to_hex(bob.publicKey),
      crypto.to_hex(carol.publicKey),
    ]);
    expect(resolved.isOwner(carol.publicKey)).toBe(true);
  });

  it("lets a member close the stream it belongs to", async () => {
    const alice = member();
    const bob = member();

    let { tree, path } = await createApplicationTree(alice.device);
    tree = await tree.share(path, alice.device, bob.publicKey, "Bob", Permissions.OWNER);
    tree = await tree.close(path, bob.device);

    expect((await tree.getChild(path)!.resolve()).isClosed()).toBe(true);
  });

  it("supports rotating the application stream to a new derivation index", async () => {
    const alice = member();
    const bob = member();

    let { tree, path } = await createApplicationTree(alice.device);
    tree = await tree.share(path, alice.device, bob.publicKey, "Bob", Permissions.OWNER);
    tree = await tree.close(path, alice.device);

    const nextPath = tree.getApplicationRootPath(APPLICATION_ID, 1);
    tree = await tree.share(nextPath, alice.device, bob.publicKey, "Bob", Permissions.OWNER);

    const resolved = await tree.getChild(nextPath)!.resolve();
    expect(resolved.getMembersData().map(m => m.name)).toEqual(["Bob"]);
    expect(await bob.device.readKey(tree, DerivationPath.toIndexArray(nextPath))).toBeDefined();
  });
});
