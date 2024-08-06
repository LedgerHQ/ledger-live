import { getEnv } from "@ledgerhq/live-env";
import { makeCipher } from "../cipher";
import { MockSDK } from "@ledgerhq/trustchain/mockSdk";

describe("makeCipher on static data set", () => {
  const trustchainSdk = new MockSDK({
    apiBaseUrl: getEnv("TRUSTCHAIN_API_STAGING"),
    applicationId: 16,
    name: "test",
  });
  const cipher = makeCipher(trustchainSdk);
  const trustchain = {
    rootId: "mock-root-id",
    walletSyncEncryptionKey: "test-encryption-key",
    applicationPath: "0'/16'/0'",
  };
  const data = {
    foo: [
      {
        bar: "baz",
      },
      4,
    ],
    emojis: "🚀🌕🦄",
    number: 42,
  };

  it("encrypt/decrypt works together", async () => {
    const encrypted = await cipher.encrypt(trustchain, data);
    const decrypted = await cipher.decrypt(trustchain, encrypted);
    expect(decrypted).toMatchObject(data);
  });

  it("encrypt is stable (non regression on encrypted data)", async () => {
    const encrypted = await cipher.encrypt(trustchain, data);
    expect(encrypted).toBe(
      "h2NUqbU0MKhNdVGptbXTrU39baq1SsXZTsW1VkYGpmY6v17wDJjKg2cgzAo8A5rStcW1hlpGtla/Wtm5Sv9ZJOjg",
    );
  });

  it("decrypt is stable (non regression on decrypted data)", async () => {
    const encrypted =
      "h2NUqbU0MKhNdVGptbXTrU39baq1SsXZTsW1VkYGpmY6v17wDJjKg2cgzAo8A5rStcW1hlpGtla/Wtm5Sv9ZJOjg";
    const decrypted = await cipher.decrypt(trustchain, encrypted);
    expect(decrypted).toEqual(data);
  });
});
