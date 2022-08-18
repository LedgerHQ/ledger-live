// import Transport from "@ledgerhq/hw-transport-node-hid";
import Transport from "@ledgerhq/hw-transport";
import SpeculosTransport from "@ledgerhq/hw-transport-node-speculos";
import { getXpubComponents } from "../src/bip32";
import Btc from "../src/Btc";
import BtcNew from "../src/BtcNew";
import { compressPublicKey } from "../src/compressPublicKey";
import { AppClient } from "../src/newops/appClient";
import { runSignTransaction, TestingClient } from "./newops/integrationtools";
import {
  CoreTx,
  p2wpkhWrapped2in2out as p2wpkhWrapped2inWithChange,
  speculosP2pkh,
  speculosP2pkhWithChange,
  speculosP2tr,
  speculosP2trWithChange,
  speculosP2wpkh2inWithChange,
} from "./newops/testtx";
import { approveTransaction } from "./speculosclient";

const xpubs = {
  "m/44'/1'/0'":
    "tpubDCwYjpDhUdPGP5rS3wgNg13mTrrjBuG8V9VpWbyptX6TRPbNoZVXsoVUSkCjmQ8jJycjuDKBb9eataSymXakTTaGifxR6kmVsfFehH1ZgJT",
  "m/44'/1'/10'":
    "tpubDCwYjpDhUdPGp21gSpVay2QPJVh6WNySWMXPhbcu1DsxH31dF7mY18oibbu5RxCLBc1Szerjscuc3D5HyvfYqfRvc9mesewnFqGmPjney4d",
  "m/44'/1'/2'/1/42":
    "tpubDGF9YgHKv6qh777rcqVhpmDrbNzgophJM9ec7nHiSfrbss7fVBXoqhmZfohmJSvhNakDHAspPHjVVNL657tLbmTXvSeGev2vj5kzjMaeupT",
  "m/48'/1'/4'/1'/0/7":
    "tpubDK8WPFx4WJo1R9mEL7Wq325wBiXvkAe8ipgb9Q1QBDTDUD2YeCfutWtzY88NPokZqJyRPKHLGwTNLT7jBG59aC6VH8q47LDGQitPB6tX2d7",
  "m/49'/1'/1'/1/3":
    "tpubDGnetmJDCL18TyaaoyRAYbkSE9wbHktSdTS4mfsR6inC8c2r6TjdBt3wkqEQhHYPtXpa46xpxDaCXU2PRNUGVvDzAHPG6hHRavYbwAGfnFr",
  "m/84'/1'/2'/0/10":
    "tpubDG9YpSUwScWJBBSrhnAT47NcT4NZGLcY18cpkaiWHnkUCi19EtCh8Heeox268NaFF6o56nVeSXuTyK6jpzTvV1h68Kr3edA8AZp27MiLUNt",
  "m/86'/1'/4'/1/12":
    "tpubDHTZ815MvTaRmo6Qg1rnU6TEU4ZkWyA56jA1UgpmMcBGomnSsyo34EZLoctzZY9MTJ6j7bhccceUeXZZLxZj5vgkVMYfcZ7DNPsyRdFpS3f",
};

// async function listAddresses(paths: string[], addressFormat: AddressFormat) {
//   const tr = await transport();
//   const client = new AppClient(tr);
//   const btc = new BtcNew(client);
//   let result = "";
//   for (let i = 0; i < paths.length; i++) {
//     const addr = await btc.getWalletPublicKey(paths[i], {
//       format: addressFormat,
//     });
//     result += paths[i] + ": " + addr.bitcoinAddress + "\n";
//   }
//   await tr.close();
//   console.log(result);
// }

jest.setTimeout(1000000);
test("Speculos p2pkh", async () => {
  const ins = ["m/44'/1'/0'/0/0"];
  const tx = await testSigning(speculosP2pkh, { ins });
  expect(tx).toEqual(speculosP2pkh.hex);
});

test("Speculos p2tr", async () => {
  const ins = ["m/86'/1'/0'/0/0"];
  const tx = await testSigning(speculosP2tr, { ins });
  checkIgnoreWitness(speculosP2tr, tx);
});

test("Speculos p2tr with change", async () => {
  const ins = ["m/86'/1'/0'/0/1"];
  const out = "m/86'/1'/0'/1/0";
  const tx = await testSigning(speculosP2trWithChange, { ins, out });
  checkIgnoreWitness(speculosP2trWithChange, tx);
});

test("Speculos p2wpkhWrapped with change", async () => {
  const ins = ["m/49'/1'/0'/1/0", "m/49'/1'/0'/0/2"];
  const out = "m/49'/1'/0'/1/1";
  const tx = await testSigning(p2wpkhWrapped2inWithChange, { ins, out });
  expect(tx).toEqual(p2wpkhWrapped2inWithChange.hex);
});

test("Speculoas p2wpkh with change", async () => {
  const ins = ["m/84'/1'/0'/0/1", "m/84'/1'/0'/1/4"];
  const out = "m/84'/1'/0'/1/5";
  const tx = await testSigning(speculosP2wpkh2inWithChange, { ins, out });
  expect(tx).toEqual(speculosP2wpkh2inWithChange.hex);
});

test("Speculos p2pkh with change", async () => {
  const ins = ["m/44'/1'/0'/1/0", "m/44'/1'/0'/0/3"];
  const out = "m/44'/1'/0'/1/2";
  // Pay 0.005 tBTC to mz5vLWdM1wHVGSmXUkhKVvZbJ2g4epMXSm
  const tx = await testSigning(speculosP2pkhWithChange, { ins, out });
  expect(tx).toEqual(speculosP2pkhWithChange.hex);
});

async function testSigning(
  testTx: CoreTx,
  paths: { ins: string[]; out?: string }
): Promise<string> {
  let tr;
  try {
    tr = await transport();
  } catch (e) {
    console.error("FIXME: SPECULOS TEST IGNORED BECAUSE INSTANCE IS NOT UP", e);
    return testTx.hex;
  }
  const client = new TestingClient(tr);
  // Automatically accept a transaction
  //acceptTx(tr, testTx.vout.length - (paths.out ? 1 : 0));
  await approveTransaction();
  const tx = await runSignTransaction(testTx, paths, client, tr);
  await tr.close();
  return tx;
}

/**
 * Schnorr signatures use a true random nonce, which makes two
 * signatures of the same message and key different, so we can't
 * compare the witness data in full, hence this function.
 */
function checkIgnoreWitness(testTx: CoreTx, actualTx: string) {
  expect(actualTx.length).toEqual(testTx.hex.length);
  let expBaseTx = testTx.hex;
  let actBaseTx = actualTx;
  // Clean out the witness data items, but not the witness as a whole,
  // meaning we will compare number of witness items for example.
  testTx.vin.forEach((input) => {
    if (!input.txinwitness) {
      return;
    }
    input.txinwitness.forEach((value) => {
      const index = expBaseTx.indexOf(value);
      expBaseTx =
        expBaseTx.substring(0, index) +
        expBaseTx.substring(index + value.length);
      actBaseTx =
        actBaseTx.substring(0, index) +
        actBaseTx.substring(index + value.length);
    });
  });
  expect(actBaseTx).toEqual(expBaseTx);
}

test("getWalletPublicKey BtcOld", async () => {
  await runGetWalletPublicKey("old");
});

test("getWalletPublicKey BtcNew", async () => {
  await runGetWalletPublicKey("new");
});

async function transport(): Promise<SpeculosTransport> {
  return await SpeculosTransport.open({ apduPort: 9999, buttonPort: 9998 });
}

async function impl(
  variant: "old" | "new",
  transport: Transport
): Promise<Btc | BtcNew> {
  if (variant === "old") {
    return new Btc(transport);
  }
  const client = new AppClient(transport);
  const btc = new BtcNew(client);
  return btc;
}

async function runGetWalletPublicKey(variant: "old" | "new") {
  let tr;
  try {
    tr = await transport();
  } catch (e) {
    console.error("FIXME: SPECULOS TEST IGNORED BECAUSE INSTANCE IS NOT UP", e);
    return;
  }
  try {
    const btc = await impl(variant, tr);

    const account = await btc.getWalletPublicKey("m/44'/1'/0'");
    const expectedAccount = getXpubComponents(xpubs["m/44'/1'/0'"]);

    const uncompressesPubkey =
      "04e84c7f4b7662faed9f5eb2d812d9b7bcf0e0bf2a33b17ac45e38b8459669c321816e33dd5541f01ac4e9dbee1ad25fccf2bdc1dc16336b3ae66463c093d612ed";
    expect(compressPublicKey(Buffer.from(uncompressesPubkey, "hex"))).toEqual(
      expectedAccount.pubkey
    );

    expect(account.chainCode).toEqual(
      expectedAccount.chaincode.toString("hex")
    );
    expect(account.publicKey).toEqual(uncompressesPubkey);

    const keydata = await btc.getWalletPublicKey("m/44'/1'/0'/0/0");
    expect(keydata.bitcoinAddress).toEqual(
      "mz5vLWdM1wHVGSmXUkhKVvZbJ2g4epMXSm"
    );
  } finally {
    tr.close();
  }
}
