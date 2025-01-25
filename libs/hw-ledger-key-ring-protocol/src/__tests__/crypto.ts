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

  it("should verify truncated signature by padding 0s from the start", async () => {
    const hash = crypto.from_hex(
      "19514a2e50bfad4a6de397ebde776191cbb720e8bbfcc3c165385c3664c03341",
    );
    const signature = crypto.from_hex(
      // Here the "S" part of the signature is only 31 bytes long it should be padded with a 0
      "3043022052a82876fcd4d9d8383ce12a7e4d96bb4c1d9e71e857cd087c092b87cec6baeb021f6b86b9a3bab1e7794ca6ef081c66cb6e6dff06cceddbd23e1f25089e311784",
    );
    const issuer = crypto.from_hex(
      "026e7bf1e015da491674be5796b15d6fabd1f454aad478a6a223934e5a872719e0",
    );
    expect(await crypto.verify(hash, signature, issuer)).toBe(true);
  });
});
