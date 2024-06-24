import { crypto } from "../Crypto";

describe("Sodium wrapper tester", () => {
  it("should computes the same symetric key with ECDH using two parties", async () => {
    const kp1 = await crypto.randomKeypair();
    const kp2 = await crypto.randomKeypair();
    const shared1 = await crypto.ecdh(kp1, kp2.publicKey);
    const shared2 = await crypto.ecdh(kp2, kp1.publicKey);

    expect(crypto.to_hex(shared1)).toBe(crypto.to_hex(shared2));
  });

  it("should encrypt a message and decrypt using the same symmetric key", async () => {
    //const message = "Hello world!"
    const message = await crypto.randomBytes(64);
    const key = await crypto.randomBytes(32);
    const nonce = await crypto.randomBytes(16);
    const encrypted = await crypto.encrypt(key, nonce, message);
    const decrypted = await crypto.decrypt(key, nonce, encrypted);
    expect(crypto.to_hex(decrypted)).toBe(crypto.to_hex(message));
  });

  it("should encrypt user data", async () => {
    const keypair = await crypto.randomKeypair();
    const data = await crypto.randomBytes(64);
    const encrypted = await crypto.encryptUserData(keypair.privateKey, data);
    const decrypted = await crypto.decryptUserData(keypair.privateKey, encrypted);
    expect(crypto.to_hex(decrypted)).toBe(crypto.to_hex(data));
  });
});
