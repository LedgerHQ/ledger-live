import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import polkadotResolver from "@ledgerhq/coin-polkadot/signer/index";
import { executeWithSigner } from "../../bridge/setup";
import { mockDeviceWithAPDUs, releaseMockDevice } from "../../__tests__/test-helpers/mockDevice";
import { createSigner } from "./setup";

const SEED_APDUS = `
  => f9010000182c0000806201008000000080000000000000000000000000
  <= 3a521fa830998568da9c205c987dcd157a78b2bd30ece3d1b6c32213986864ca31324b5542335272346163346469354a47707a545935474e516b44564e6b50556b636a324d4746546d7a617a4d5364739000
`;

const FIRST_ACCOUNT_APDUS = `
  => f9010000182c0000806201008000000080000000800000008000000000
  <= 7e52138bf614dddff1116623b027ea92d6015d8fe741575b78ac7773545066bd31337264523573727657463533566b4e654a757a35576b476b4736465358515141375a423551424769673441544373399000
`;

const SEED_PUBLIC_KEY = "3a521fa830998568da9c205c987dcd157a78b2bd30ece3d1b6c32213986864ca";
const SEED_ADDRESS = "12KUB3Rr4ac4di5JGpzTY5GNQkDVNkPUkcj2MGFTmzazMSds";
const FIRST_ACCOUNT_PUBLIC_KEY = "7e52138bf614dddff1116623b027ea92d6015d8fe741575b78ac7773545066bd";
const FIRST_ACCOUNT_ADDRESS = "13rdR5srvWF53VkNeJuz5WkGkG6FSXQQA7ZB5QBGig4ATCs9";

const openSigner = async (apdus: string) => {
  const transport = await openTransportReplayer(RecordStore.fromString(apdus));
  return createSigner(transport);
};

describe("polkadot setup createSigner", () => {
  it("reads the public key and address of the seed from the device", async () => {
    const signer = await openSigner(SEED_APDUS);

    const result = await signer.getAddress("44'/354'/0'", 0, false);

    expect({ pubKey: result.pubKey, address: result.address }).toEqual({
      pubKey: SEED_PUBLIC_KEY,
      address: SEED_ADDRESS,
    });
  });

  it("reads the public key and address of the first account from the device", async () => {
    const signer = await openSigner(FIRST_ACCOUNT_APDUS);

    const result = await signer.getAddress("44'/354'/0'/0'/0'", 0, false);

    expect({ pubKey: result.pubKey, address: result.address }).toEqual({
      pubKey: FIRST_ACCOUNT_PUBLIC_KEY,
      address: FIRST_ACCOUNT_ADDRESS,
    });
  });

  it("resolves the address, the public key and the path through the polkadot resolver", async () => {
    const signer = await openSigner(FIRST_ACCOUNT_APDUS);
    const resolve = polkadotResolver((_deviceId, job) => job(signer));

    const result = await resolve("device", {
      currency: getCryptoCurrencyById("assethub_polkadot"),
      path: "44'/354'/0'/0'/0'",
      derivationMode: "polkadotbip44",
    });

    expect(result).toEqual({
      address: FIRST_ACCOUNT_ADDRESS,
      publicKey: FIRST_ACCOUNT_PUBLIC_KEY,
      path: "44'/354'/0'/0'/0'",
    });
  });

  it("hands the signer to the job through the device context", async () => {
    const deviceId = await mockDeviceWithAPDUs(FIRST_ACCOUNT_APDUS);
    const context = executeWithSigner(createSigner);

    const result = await context(deviceId, signer =>
      signer.getAddress("44'/354'/0'/0'/0'", 0, false),
    ).finally(() => releaseMockDevice(deviceId));

    expect({ pubKey: result.pubKey, address: result.address }).toEqual({
      pubKey: FIRST_ACCOUNT_PUBLIC_KEY,
      address: FIRST_ACCOUNT_ADDRESS,
    });
  });
});
