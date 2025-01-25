import {
  AddMember,
  createCommandBlock,
  Permissions,
  PublishKey,
  Seed,
  signCommandBlock,
} from "../CommandBlock";
import { TLV } from "../tlv";
import { CommandStreamDecoder } from "../CommandStreamDecoder";
import { CommandStreamEncoder } from "../CommandStreamEncoder";
import { crypto } from "../Crypto";
import { CommandStream } from "..";

describe("Encode/Decode command stream tester", () => {
  it("should encode and decode a byte", () => {
    const byte = 42;
    let buffer = new Uint8Array();
    buffer = TLV.pushByte(buffer, 42);
    const decoded = TLV.readVarInt(TLV.readTLV(buffer, 0));
    expect(decoded.value).toBe(byte);
  });

  it("should encode and decode a Int32", () => {
    const varint = 0xdeadbeef;
    let buffer = new Uint8Array();
    buffer = TLV.pushInt32(buffer, varint);
    const decoded = TLV.readVarInt(TLV.readTLV(buffer, 0));
    expect(decoded.value).toBe(varint);
  });

  it("should encode and decode a string", () => {
    const str = "Hello World";
    let buffer = new Uint8Array();
    buffer = TLV.pushString(buffer, str);
    const decoded = TLV.readString(TLV.readTLV(buffer, 0));
    expect(decoded.value).toBe(str);
  });

  it("should encode and decode a hash", () => {
    const hash = crypto.hash(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
    let buffer = new Uint8Array();
    buffer = TLV.pushHash(buffer, hash);
    const decoded = TLV.readHash(TLV.readTLV(buffer, 0));
    expect(crypto.to_hex(decoded.value)).toEqual(crypto.to_hex(hash));
  });

  it("should encode and decode bytes", () => {
    const bytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let buffer = new Uint8Array();
    buffer = TLV.pushBytes(buffer, bytes);
    const decoded = TLV.readBytes(TLV.readTLV(buffer, 0));
    expect(decoded.value).toEqual(bytes);
  });

  it("should encode and decode a signature", () => {
    const alice = crypto.randomKeypair();
    const block = signCommandBlock(
      createCommandBlock(alice.publicKey, []),
      alice.publicKey,
      alice.privateKey,
    );
    let buffer = new Uint8Array();
    buffer = TLV.pushSignature(buffer, block.signature);
    const decoded = TLV.readSignature(TLV.readTLV(buffer, 0));
    expect(decoded.value).toEqual(block.signature);
  });

  it("should encode and decode a public key", () => {
    const alice = crypto.randomKeypair();
    let buffer = new Uint8Array();
    buffer = TLV.pushPublicKey(buffer, alice.publicKey);
    const decoded = TLV.readPublicKey(TLV.readTLV(buffer, 0));
    expect(decoded.value).toEqual(alice.publicKey);
  });

  it("should encode and decode a stream. Encoding/Decoding should not alter the stream", () => {
    const alice = crypto.randomKeypair();
    const groupPk = crypto.randomKeypair();
    const groupChainCode = crypto.randomBytes(32);
    const xpriv = new Uint8Array(64);
    const initializationVector = crypto.randomBytes(16);
    xpriv.set(groupPk.privateKey);
    xpriv.set(groupChainCode, 32);
    const ephemeralPk = crypto.randomKeypair();

    const block1 = signCommandBlock(
      createCommandBlock(alice.publicKey, [
        new Seed(
          crypto.randomBytes(16),
          0,
          groupPk.publicKey,
          initializationVector,
          xpriv,
          ephemeralPk.publicKey,
        ),
      ]),
      alice.publicKey,
      alice.privateKey,
    );

    const block2 = signCommandBlock(
      createCommandBlock(alice.publicKey, [
        new AddMember("Alice", crypto.randomBytes(32), Permissions.OWNER),
        new PublishKey(
          crypto.randomBytes(16),
          crypto.randomBytes(32),
          crypto.randomBytes(32),
          crypto.randomBytes(32),
        ),
      ]),
      alice.publicKey,
      alice.privateKey,
    );
    const block3 = signCommandBlock(
      createCommandBlock(alice.publicKey, []),
      alice.publicKey,
      alice.privateKey,
    );

    const stream = [block1, block2, block3];

    const encoded = CommandStreamEncoder.encode(stream);
    const digestEncoded = crypto.hash(encoded);

    const decoded = CommandStreamDecoder.decode(encoded);
    const reencoded = CommandStreamEncoder.encode(decoded);
    const digestReencoded = crypto.hash(reencoded);
    expect(digestEncoded).toEqual(digestReencoded);
  });

  it("decodes a specific command stream", async () => {
    const tlv =
      "0101010220824b3168c79e8b61b599751c107117b5c9b647f2b6859de8a245952559707692062102a13e82cd0d2f77d1ab1434d8bd799571e54cd32e1121c5cf82217f8b0b713b6b01010315a8050c800000008000001080000000062103ccf74aa7775b3d39d6cbb0236acee7a7f980b9f6a556a4d814d44b0bd56cb77b05108c51eda6be26623ca919ed17333afcdb054019c0b60ede1692479cc04ce69eae6a0bd51941bab6f044f3dec10c11cf11e6253504d1df6b0aab7dc1996e4eaa7c6f92c29153c59534578901cd7ff4efcea1ae06210268abdb3d49ba4a274ce8660cde0d1eeaf1fea00e281218be775f6b3aefc39756113a040f7765622d746f6f6c732d6563626638062103a270456b0f95714cc61a6473e6b6d8db354a3c377281096bdd2439a5475ecbf80104ffffffff129a05100e5205b4a616b2a4d79b07b4a4932f560540669e741f38fee07956fb0dc0ea9978d55bd5d8424b0d0f66a2c5a45788f92d0ddc283138c7ba62c521de1d604ee7f847c5aed40a11536bbe742af0be8cfd4132062103a270456b0f95714cc61a6473e6b6d8db354a3c377281096bdd2439a5475ecbf80621027003755248202ea8a67d1fcdcd82d7f7022248f3af892fa5307d3ea250dc81050346304402204422a779fd08723d8cba19c0cc11ef7a24f6f1f459cb01598ff1a26f27ea8976022053a554d4f509223f2d08faa5de796fed13a9762f35da08e94884edd1f7c0d015";
    const decoded = CommandStreamDecoder.decode(crypto.from_hex(tlv));
    const stream = new CommandStream(decoded);
    const resolved = await stream.resolve();
    expect(resolved.getMembersData()).toEqual([
      {
        id: "03a270456b0f95714cc61a6473e6b6d8db354a3c377281096bdd2439a5475ecbf8",
        name: "web-tools-ecbf8",
        permissions: 4294967295,
      },
    ]);
  });
});
