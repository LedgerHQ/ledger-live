import { makeCipher } from "../cipher";
import type { Trustchain, TrustchainSDK } from "../../trustchain-types";

function makeMockTrustchainSdk(): TrustchainSDK {
  return {
    withAuth: jest.fn(async (_trustchain, _creds, fn) => fn({ accessToken: "mock-jwt" })),
    encryptUserData: jest.fn(async (_trustchain, data) => data),
    decryptUserData: jest.fn(async (_trustchain, data) => data),
  };
}

describe(makeCipher.name, () => {
  const trustchain: Trustchain = {
    rootId: "root",
    walletSyncEncryptionKey: "key",
    applicationPath: "0'/16'/0'",
  };
  const data = { foo: [{ bar: "baz" }, 4], emojis: "🚀", number: 42 };

  it("encrypt/decrypt round-trips data", async () => {
    const cipher = makeCipher(makeMockTrustchainSdk());
    const encrypted = await cipher.encrypt(trustchain, data);
    const decrypted = await cipher.decrypt(trustchain, encrypted);
    expect(decrypted).toEqual(data);
  });
});
