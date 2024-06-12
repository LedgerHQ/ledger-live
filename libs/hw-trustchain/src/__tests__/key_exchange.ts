import { createDevice } from "../Device";

import CommandStream from "../CommandStream";
import { Permissions } from "../CommandBlock";
import { crypto } from "../Crypto";
import { StreamTreeCipher } from "../StreamTreeCipher";
import { StreamTree } from "../StreamTree";

const DEFAULT_TOPIC = "c96d450545ff2836204c29af291428a5bf740304978f5dfb0b4a261474192851";

describe("Symmetric key exchange scenarii", () => {
  it("create a new group with 1 member", async () => {
    const alice = await createDevice();
    const topic = crypto.from_hex(DEFAULT_TOPIC);
    let stream = new CommandStream([]);
    stream = await stream.edit().seed(topic).issue(alice);
    const resolved = await stream.resolve();
    expect(resolved.isCreated()).toBe(true);
    expect(resolved.getMembers().length).toBe(1);
    expect(resolved.getMembersData().length).toBe(0);
    expect(crypto.to_hex(resolved.getTopic()!)).toBe(crypto.to_hex(topic));
    //const parsed = CommandStreamDecoder.decode(CommandStreamEncoder.encode(stream.blocks));
    //console.log(JSON.stringify(CommandStreamJsonifier.jsonify(parsed), null, 2));
    //const raw = CommandStreamEncoder.encode(stream.blocks);
    //console.log(crypto.to_hex(raw));
  });

  it("create a group owned by Alice, Alice adds Bob and publish a key for Bob.", async () => {
    const alice = await createDevice();
    const bob = await createDevice();

    let stream = new CommandStream();
    stream = await stream.edit().seed(crypto.from_hex(DEFAULT_TOPIC)).issue(alice);
    stream = await stream
      .edit()
      .addMember("Bob", (await bob.getPublicKey()).publicKey, Permissions.KEY_READER)
      .issue(alice);
    const tree = StreamTree.from(stream);

    // Encrypt a message from Alice
    const originalMessage = new TextEncoder().encode("Hello World!");
    const encryptedMessage = await StreamTreeCipher.create(alice).encrypt(
      tree,
      [],
      originalMessage,
    );

    // The message should be different from the original
    expect(crypto.to_hex(encryptedMessage)).not.toEqual(crypto.to_hex(originalMessage));

    // Decrypt the message from Bob
    const decryptedMessage = await StreamTreeCipher.create(bob).decrypt(tree, [], encryptedMessage);
    // The message should be the same as the original
    expect(crypto.to_hex(decryptedMessage)).toBe(crypto.to_hex(originalMessage));
  });

  it("create a group owned by Alice, Alice adds Bob and publish a key for Bob, Alice adds Charlie and Bob publishes a key for Charlie", async () => {
    const alice = await createDevice();
    const bob = await createDevice();
    const charlie = await createDevice();

    let stream = new CommandStream();
    stream = await stream.edit().seed(crypto.from_hex(DEFAULT_TOPIC)).issue(alice);
    stream = await stream
      .edit()
      .addMember("Bob", (await bob.getPublicKey()).publicKey, Permissions.KEY_READER)
      .issue(alice);
    stream = await stream
      .edit()
      .addMember("Charlie", (await charlie.getPublicKey()).publicKey, Permissions.KEY_READER)
      .issue(alice);

    const tree = StreamTree.from(stream);

    // Encrypt a message from Alice
    const originalMessage = new TextEncoder().encode("Hello World!");
    const encryptedMessage = await StreamTreeCipher.create(alice).encrypt(
      tree,
      [],
      originalMessage,
    );
    // The message should be different from the original
    expect(crypto.to_hex(encryptedMessage)).not.toBe(crypto.to_hex(originalMessage));

    {
      // Decrypt the message from Bob
      const decryptedMessage = await StreamTreeCipher.create(bob).decrypt(
        tree,
        [],
        encryptedMessage,
      );
      // The message should be the same as the original
      expect(crypto.to_hex(decryptedMessage)).toBe(crypto.to_hex(originalMessage));
    }

    {
      // Decrypt the message from Charlie
      const decryptedMessage = await StreamTreeCipher.create(charlie).decrypt(
        tree,
        [],
        encryptedMessage,
      );
      // The message should be the same as the original
      expect(crypto.to_hex(decryptedMessage)).toBe(crypto.to_hex(originalMessage));
    }

    //console.log(crypto.to_hex(CommandStreamEncoder.encode(stream.blocks)));
    //const parsed = CommandStreamDecoder.decode(CommandStreamEncoder.encode(stream.blocks));
    //console.log(JSON.stringify(CommandStreamJsonifier.jsonify(parsed), null, 2));
  });

  it("creates group owned by Alice, Alice adds Bob as an admin, Bob adds Charlie", async () => {
    const alice = await createDevice();
    const bob = await createDevice();
    const charlie = await createDevice();

    let stream = new CommandStream();
    stream = await stream.edit().seed(crypto.from_hex(DEFAULT_TOPIC)).issue(alice);
    stream = await stream
      .edit()
      .addMember(
        "Bob",
        (await bob.getPublicKey()).publicKey,
        Permissions.ADD_MEMBER | Permissions.KEY_READER,
      )
      .issue(alice);
    stream = await stream
      .edit()
      .addMember("Charlie", (await charlie.getPublicKey()).publicKey, Permissions.KEY_READER)
      .issue(bob);

    const tree = StreamTree.from(stream);

    // Encrypt a message from Alice
    const originalMessage = new TextEncoder().encode("Hello World!");
    const encryptedMessage = await StreamTreeCipher.create(alice).encrypt(
      tree,
      [],
      originalMessage,
    );
    // The message should be different from the original
    expect(crypto.to_hex(encryptedMessage)).not.toBe(crypto.to_hex(originalMessage));

    {
      // Decrypt the message from Bob
      const decryptedMessage = await StreamTreeCipher.create(bob).decrypt(
        tree,
        [],
        encryptedMessage,
      );
      // The message should be the same as the original
      expect(crypto.to_hex(decryptedMessage)).toBe(crypto.to_hex(originalMessage));
    }

    {
      // Decrypt the message from Charlie
      const decryptedMessage = await StreamTreeCipher.create(charlie).decrypt(
        tree,
        [],
        encryptedMessage,
      );
      // The message should be the same as the original
      expect(crypto.to_hex(decryptedMessage)).toBe(crypto.to_hex(originalMessage));
    }
    //console.log(JSON.stringify(CommandStreamJsonifier.jsonify(stream.blocks), null, 2));
  });
});
