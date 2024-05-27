import { CommandStream, Derive, crypto, device } from "..";
import {
  createSpeculosDevice,
  releaseSpeculosDevice,
  SpeculosDevice,
  DeviceModelId,
} from "@ledgerhq/speculos-transport";
import { StreamTree } from "../StreamTree";
import { DerivationPath } from "../Crypto";

// uncomment to see logs if you need to investigate issues
import { listen } from "@ledgerhq/logs";

const DEFAULT_TOPIC = "c96d450545ff2836204c29af291428a5bf740304978f5dfb0b4a261474192851";
const ROOT_DERIVATION_PATH = "16'/0'";

let speculos: SpeculosDevice;
let sub;
let logSub;
beforeEach(async () => {
  logSub = listen(log => {
    // eslint-disable-next-line no-console
    console.log(log.type + ": " + log.message);
  });
  speculos = await createSpeculosDevice({
    model: DeviceModelId.nanoS,
    firmware: "2.0.0",
    appName: "Trustchain",
    appVersion: "0.0.1",
    seed: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
    coinapps: __dirname,
    overridesAppPath: "app.elf",
  });

  // passthrough all success cases
  sub = speculos.transport.automationEvents.subscribe(event => {
    if (event.text === "sync group") {
      speculos.transport.button("right");
    } else if (event.text === "Activate Wallet sync") {
      speculos.transport.button("right");
    } else if (event.text === "Approve") {
      speculos.transport.button("both");
    }
  });
}, 60000);

afterEach(async () => {
  sub.unsubscribe();
  await releaseSpeculosDevice(speculos.id);
  logSub();
});

describe("Chain is owned by a device", () => {
  it("should be connected to a device", async () => {
    const alice = device.apdu(speculos.transport);
    expect(await alice.isConnected()).toBe(true);
  });

  it("can sign some data", async () => {
    const alice = device.apdu(speculos.transport);
    const challenge =
      "0101070201001210cd2babbeeae850d3143215de16b82609140101154630440220717f1f6ca7c518178bdaebee46a6ab478e82f52970a5e5d89f016b0f08dd101a022049b6fbb56c87afbad519b929af6b47b5cec24cbc59c2a52c34e03aae87b41df71604664f6ddb20096c6f63616c686f7374320121332103cb7628e7248ddf9c07da54b979f16bf081fb3d173aac0992ad2a44ef6a388ae2600401000000";

    sub.unsubscribe();
    sub = speculos.transport.automationEvents.subscribe(event => {
      if (event.text === "localhost") {
        speculos.transport.button("right");
      } else if (event.text === "Approve") {
        speculos.transport.button("both");
      }
    });
    const out = await alice.getSeedId(crypto.from_hex(challenge));
    expect(out).toEqual({
      attestationResult: crypto.from_hex(
        "000021012103f157320331ea2a70bb3075e8a8e6f9d696816143e9b3d6eb5c1aab5e6c7d0b6946304402204cce0879349be375e0c527c565a9f416d1da0f48f0836c944d201dcdcd553b0402204c25019341c5fb04869fb2b1e65a6ec9ac5b086675161ada5a106e420160e492",
      ),
      attestation: crypto.from_hex(
        "304402204cce0879349be375e0c527c565a9f416d1da0f48f0836c944d201dcdcd553b0402204c25019341c5fb04869fb2b1e65a6ec9ac5b086675161ada5a106e420160e492",
      ),
      attestationPubkeyCredential: {
        curveId: 33,
        publicKey: crypto.from_hex(
          "03f157320331ea2a70bb3075e8a8e6f9d696816143e9b3d6eb5c1aab5e6c7d0b69",
        ),
        signAlgorithm: 1,
        version: 0,
      },
      attestationType: 0,
      pubkeyCredential: {
        curveId: 33,
        publicKey: crypto.from_hex(
          "02b2c29ab36022219967cc21a306599ecaf51ce9f2998da6982388d52c8c69a6a5",
        ),
        signAlgorithm: 1,
        version: 0,
      },
      signature: crypto.from_hex(
        "3045022100ad7aa50c21451e3f38142cdeddb9878d84347b31e7171fb7bafaefb1a1b7b6a9022014d8ac74ee99f916c946ddd0dcb115a8e78edad6c33b9be3a99c09f61218edc3",
      ),
    });
  });

  it("should seed a new tree", async () => {
    const alice = device.apdu(speculos.transport);
    const topic = crypto.from_hex(DEFAULT_TOPIC);
    let stream = new CommandStream([]);
    stream = await stream.edit().seed(topic).issue(alice);
    expect(stream.blocks.length).toBe(1);

    // console.dir(CommandStreamJsonifier.jsonify(stream.blocks), { depth: null });

    const resolved = await stream.resolve();
    expect(resolved.isCreated()).toBe(true);
    expect(resolved.getMembers().length).toBe(1);
    expect(crypto.to_hex(resolved.getTopic()!)).toBe(crypto.to_hex(topic));
  });

  it("should seed a new tree and add a bob", async () => {
    const alice = device.apdu(speculos.transport);
    const bob = await device.software();
    const bobPublicKey = (await bob.getPublicKey()).publicKey;
    const topic = crypto.from_hex(DEFAULT_TOPIC);
    let stream = new CommandStream([]);
    stream = await stream.edit().seed(topic).issue(alice);
    stream = await stream.edit().addMember("Bob", bobPublicKey, 0xffffffff, true).issue(alice);

    const resolved = await stream.resolve();
    expect(resolved.isCreated()).toBe(true);
    expect(resolved.getMembers().length).toBe(2);
    expect(crypto.to_hex(resolved.getTopic()!)).toBe(crypto.to_hex(topic));
    expect(resolved.getMembers().find(v => bytesEqual(v, bobPublicKey))).not.toBe(undefined);
  });

  it("should seed a new tree, and derive a subtree and add a member in the subtree", async () => {
    const alice = device.apdu(speculos.transport);
    const bob = await device.software();
    const bobPublicKey = (await bob.getPublicKey()).publicKey;
    const topic = crypto.from_hex(DEFAULT_TOPIC);
    let stream = new CommandStream();
    stream = await stream
      .edit()
      .seed(topic)
      .addMember("Bob", bobPublicKey, 0xffffffff, true)
      .issue(alice);
    // We added Bob to the root stream, to be able to perform the derivation from both the device and the software
    // to check the same data are derived.

    let tree = StreamTree.from(stream);
    stream = new CommandStream();
    stream = await stream.edit().derive(getDerivationPath(0)).issue(alice, tree);
    stream = await stream
      .edit()
      .addMember("Bob", (await bob.getPublicKey()).publicKey, 0xffffffff, true)
      .issue(alice, tree);
    tree = tree.update(stream);

    const resolved = await stream.resolve();
    const derivation = tree.getChild(getDerivationPath(0));
    const root = tree.getRoot();

    // The parent hash of the first block should be the root hash
    expect(derivation).not.toBe(null);
    expect(root).not.toBe(null);
    expect(bytesEqual(derivation!.blocks[0].parent, await root.getRootHash())).toBe(true);

    // Check if the derived secret is the one we expect
    const sharedSecret = await bob.readKey(tree, []);

    const recomputedXpriv = await crypto.derivePrivate(
      sharedSecret,
      (derivation?.blocks[0].commands[0] as Derive).path,
    );
    const derivedSecret = await bob.readKey(tree, getDerivationPath(0));
    const derivedPubKey = (derivation?.blocks[0].commands[0] as Derive).groupKey;
    const recomputedDerivedSecret = new Uint8Array([
      ...recomputedXpriv.privateKey,
      ...recomputedXpriv.chainCode,
    ]);

    expect(bytesEqual(recomputedDerivedSecret, derivedSecret)).toBe(true);
    expect(bytesEqual(derivedPubKey, recomputedXpriv.publicKey)).toBe(true);

    // Standard check on the derived stream
    expect(resolved.isCreated()).toBe(true);
    expect(resolved.getMembers().length).toBe(2);
    expect(resolved.getMembers().find(v => bytesEqual(v, bobPublicKey))).not.toBe(undefined);
  });

  it.skip("should seed a new tree, derive a subtree with 3 members, then perform a key migration", async () => {
    const alice = device.apdu(speculos.transport);
    const bob = await device.software();
    const charlie = await device.software();
    const david = await device.software();

    const bobPublicKey = (await bob.getPublicKey()).publicKey;
    const charliePublicKey = (await charlie.getPublicKey()).publicKey;
    const davidPublicKey = (await david.getPublicKey()).publicKey;

    const topic = crypto.from_hex(DEFAULT_TOPIC);
    let stream = new CommandStream();

    // Create the root
    stream = await stream.edit().seed(topic).issue(alice);
    let tree = StreamTree.from(stream);

    // Create the subtree
    stream = await new CommandStream().edit().derive(getDerivationPath(0)).issue(alice, tree);
    tree = tree.update(stream);

    // Add bob and charlie to the subtree
    stream = await stream
      .edit()
      .addMember("Bob", bobPublicKey, 0xffffffff, true)
      .addMember("Charlie", charliePublicKey, 0xffffffff, true)
      .issue(alice, tree);
    tree = tree.update(stream);
    ("");
    // Close the subtree
    stream = await stream.edit().close().issue(alice, tree);
    tree = tree.update(stream);

    // Derive a new subtree
    stream = await new CommandStream().edit().derive(getDerivationPath(1)).issue(alice, tree);
    tree = tree.update(stream);

    // Add bob to the new subtree
    stream = await stream
      .edit()
      .addMember("Bob", bobPublicKey, 0xffffffff, true)
      .issue(alice, tree);
    tree = tree.update(stream);

    // Bob adds charlie to the new subtree
    stream = await stream
      .edit()
      .addMember("Charlie", charliePublicKey, 0xffffffff, true)
      .issue(bob, tree);
    tree = tree.update(stream);

    // Add david to the new subtree
    stream = await stream
      .edit()
      .addMember("David", davidPublicKey, 0xffffffff, true)
      .issue(alice, tree);
    tree = tree.update(stream);
  });

  it("should publish a key to a member added by a software device", async () => {
    const alice = device.apdu(speculos.transport);
    const bob = await device.software();
    const charlie = await device.software();

    const bobPublicKey = (await bob.getPublicKey()).publicKey;
    const charliePublicKey = (await charlie.getPublicKey()).publicKey;

    // Create the root and add bob
    let stream = new CommandStream();
    stream = await stream
      .edit()
      .seed(crypto.from_hex(DEFAULT_TOPIC))
      .addMember("Bob", bobPublicKey, 0xffffffff, true)
      .issue(alice);

    // Bob adds charlie but doesn't publish the key
    stream = await stream
      .edit()
      .addMember("Charlie", charliePublicKey, 0xffffffff, false)
      .issue(bob);

    // Alice publish the key to charlie
    stream = await stream.edit().publishKey(charliePublicKey).issue(alice);

    expect(stream).not.toBe(null);
  });

  it("should not allow to publish a key to a non-member", async () => {
    const alice = device.apdu(speculos.transport);
    const bob = await device.software();
    const charlie = await device.software();

    const bobPublicKey = (await bob.getPublicKey()).publicKey;
    const charliePublicKey = (await charlie.getPublicKey()).publicKey;

    // Create the root and add bob
    let stream = new CommandStream();
    stream = await stream
      .edit()
      .seed(crypto.from_hex(DEFAULT_TOPIC))
      .addMember("Bob", bobPublicKey, 0xffffffff, true)
      .issue(alice);

    // Alice publish the key to charlie
    try {
      stream = await stream.edit().publishKey(charliePublicKey).issue(alice);

      expect(stream).not.toBe(null);
    } catch (e) {
      return;
    }
    fail("Should have thrown an exception");
  });
});

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length != b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] != b[i]) {
      return false;
    }
  }
  return true;
}

function getDerivationPath(index: number): number[] {
  return DerivationPath.toIndexArray(`${ROOT_DERIVATION_PATH}/${index}'`);
}
