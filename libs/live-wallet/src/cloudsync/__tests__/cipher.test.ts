import { makeCipher } from "../cipher";
import { MockSDK } from "@ledgerhq/trustchain/mockSdk";

describe("makeCipher on static data set", () => {
  const trustchainSdk = new MockSDK({
    applicationId: 16,
    name: "test",
  });
  const cipher = makeCipher(trustchainSdk);
  const trustchain = {
    rootId: "mock-root-id",
    walletSyncEncryptionKey: "test-encryption-key",
    applicationPath: "0'/16'/0'",
  };
  const data = new Uint8Array([1, 2, 3, 4, 5]);

  it("encrypt/decrypt works together", async () => {
    const encrypted = await cipher.encrypt(trustchain, data);
    const decrypted = await cipher.decrypt(trustchain, encrypted);
    expect(decrypted).toMatchObject(data);
  });

  it("encrypt is stable (non regression on encrypted data)", async () => {
    const encrypted = await cipher.encrypt(trustchain, data);
    expect(encrypted).toBe("h2NUqc2vTc0rrs2rTc0trs2tTc0prs2pTc0urs2uTc1S+v+f2Pnn");
  });

  it("decrypt is stable (non regression on decrypted data)", async () => {
    const encrypted = "h2NUqc2vTc0rrs2rTc0trs2tTc0prs2pTc0urs2uTc1S+v+f2Pnn";
    const decrypted = await cipher.decrypt(trustchain, encrypted);
    expect(decrypted).toMatchObject(data);
  });
});
