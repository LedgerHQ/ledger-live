import { crypto } from "@ledgerhq/hw-trustchain";
import { getSdk } from ".";

test("encryptUserData + decryptUserData", async () => {
  const sdk = getSdk(false, { applicationId: 16, name: "test" });
  const obj = {
    foobar: 42,
    toto: "tata",
  };
  const keypair = await crypto.randomKeypair();
  const trustchain = {
    rootId: "",
    walletSyncEncryptionKey: crypto.to_hex(keypair.privateKey),
    applicationPath: "0'/16'/0'",
  };
  const encrypted = await sdk.encryptUserData(trustchain, obj);
  const decrypted = await sdk.decryptUserData(trustchain, encrypted);
  expect(decrypted).toEqual(obj);
});
