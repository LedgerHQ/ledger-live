import { crypto } from "@ledgerhq/hw-trustchain";
import { getSdk } from ".";
import { getEnv } from "@ledgerhq/live-env";

test("encryptUserData + decryptUserData", async () => {
  const sdk = getSdk(false, {
    applicationId: 16,
    name: "test",
    apiBaseUrl: getEnv("TRUSTCHAIN_API_STAGING"),
  });
  const obj = new Uint8Array([1, 2, 3, 4, 5]);
  const keypair = await crypto.randomKeypair();
  const trustchain = {
    rootId: "",
    walletSyncEncryptionKey: crypto.to_hex(keypair.privateKey),
    applicationPath: "m/0'/16'/0'",
  };
  const encrypted = await sdk.encryptUserData(trustchain, obj);
  const decrypted = await sdk.decryptUserData(trustchain, encrypted);
  expect(decrypted).toEqual(obj);
});
