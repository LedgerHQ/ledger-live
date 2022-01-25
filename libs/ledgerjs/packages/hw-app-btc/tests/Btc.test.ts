import Transport from "@ledgerhq/hw-transport";
import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Btc from "../src/Btc";
import BtcNew from "../src/BtcNew";
import BtcOld, { AddressFormat } from "../src/BtcOld";
import { AppAndVersion, getAppAndVersion } from "../src/getAppAndVersion";
import { TestingClient } from "./newops/integrationtools";

test("btc.getWalletXpub", async () => {
  /*
This is how I generate the xpub
Mainnet:
prv: 0x0488ade4 = 76066276
pub: 0x0488b21e = 76067358
Testnet:
prv: 0x04358394 = 70615956
pub: 0x043587cf = 70617039

versionpriv=70615956
versionpub=70617039
seed=be388c569b4a6846c847e882e09f000000000000000000000000e255bcd17cb8
m=`bx hd-new -v $versionpriv $seed`
m_44h=`bx hd-private -d --index 44 $m`
m_44h_0h=`bx hd-private -d --index 0 $m_44h`
M_44h_0h=`bx hd-to-public -v $versionpub $m_44h_0h`
m_44h_0h_17h=`bx hd-private -d --index 17 $m_44h_0h`
M_44h_0h_17h=`bx hd-to-public -v $versionpub $m_44h_0h_17h`
echo "M_44h_0h_17h xpub: $M_44h_0h_17h"
echo "M_44h_0h: `bx base58check-decode $M_44h_0h`"
echo "M_44h_0h_17h: `bx base58check-decode $M_44h_0h_17h`"

Output (note that version (4) should be prepended to payload):
M_44h_0h_17h xpub: tpubDDn3XrB65rhCzRh4fsD8gogX9gFvGcEmP3jZtGbdxK7Mn25gipFB68vLFyqZ43i4e5Z7p6rki7THyb2PeH1D3NkLm5EUFzbUzyafp872GKa
M_44h_0h: wrapper
{
    checksum 2142374336
    payload 3587cf026d874e2b800000008bd937d416de7020952cc8e2c99ce9ac7e01265e31ceb8e47bf9c3
7f46f8abbd035d4a72237572a91e13818fa38cedabe6174569cc9a319012f75150d5c0a0639d
    version 4
}
M_44h_0h_17h: wrapper
{
    checksum 4186623970
    payload 3587cf03ee6e81fd80000011c071c6f2d05cbc9ea9a04951b238086ce1608cf00020c3cab85b36
aac5fdd59102250dfdfb84c1efd160ed0e10ebac845d0e4b04277174630ba56de96bbd3afb21
    version 4
}

The xpub bytes (from bip32) are
4 byte: version bytes (mainnet: 0x0488B21E public, 0x0488ADE4 private; testnet: 0x043587CF public, 0x04358394 private)
1 byte: depth: 0x00 for master nodes, 0x01 for level-1 derived keys, ....
4 bytes: the fingerprint of the parent's key (0x00000000 if master key)
4 bytes: child number. This is ser32(i) for i in xi = xpar/i, with xi the key being serialized. (0x00000000 if master key)
32 bytes: the chain code
33 bytes: the public key or private key data (serP(K) for public keys, 0x00 || ser256(k) for private keys)

M_44h_0h_17h:
043587cf
03
ee6e81fd
80000011
c071c6f2d05cbc9ea9a04951b238086ce1608cf00020c3cab85b36aac5fdd591
02250dfdfb84c1efd160ed0e10ebac845d0e4b04277174630ba56de96bbd3afb21

M_44h_0h:
043587cf
02
6d874e2b
80000000
8bd937d416de7020952cc8e2c99ce9ac7e01265e31ceb8e47bf9c37f46f8abbd
035d4a72237572a91e13818fa38cedabe6174569cc9a319012f75150d5c0a0639d

Uncompress (a bit covoluted, but works):
prv=`bx hd-to-ec -p $versionpriv $m_44h_0h_17h`
bx ec-to-public -u ${prv:2}
04250dfdfb84c1efd160ed0e10ebac845d0e4b04277174630ba56de96bbd3afb21fc6c04ce0d5a0cbd784fdabc99d16269c27cf3842fe8440f1f21b8af900f0eaa
pubCompr=`bx ec-to-public ${prv:2}`
bx ec-to-address $pubCompr
16Y97ByhyboePhTYMMmFj1tq5Cy1bDq8jT

prv=`bx hd-to-ec -p $versionpriv $m_44h_0h`
bx ec-to-public -u ${prv:2}
045d4a72237572a91e13818fa38cedabe6174569cc9a319012f75150d5c0a0639d54eafd13a68d079b7a67764800c6a981825ef52384f08c3925109188ab21bc09
pubCompr=`bx ec-to-public ${prv:2}`
bx ec-to-address $pubCompr
1NjiCsVBuKDT62LmaUd7WZZZBK2gPAkisb

These translates to
  pubkeylen(1) || pubkeyuncompressed(65) || addrLen(1) || address || chaincode(32)

Expected response for m/44'/0'/17':
41
04250dfdfb84c1efd160ed0e10ebac845d0e4b04277174630ba56de96bbd3afb21fc6c04ce0d5a0cbd784fdabc99d16269c27cf3842fe8440f1f21b8af900f0eaa
22
ascii(16Y97ByhyboePhTYMMmFj1tq5Cy1bDq8jT)
c071c6f2d05cbc9ea9a04951b238086ce1608cf00020c3cab85b36aac5fdd591

Expected response for m/44'/0':
41
045d4a72237572a91e13818fa38cedabe6174569cc9a319012f75150d5c0a0639d54eafd13a68d079b7a67764800c6a981825ef52384f08c3925109188ab21bc09
22
ascii(1NjiCsVBuKDT62LmaUd7WZZZBK2gPAkisb)
8bd937d416de7020952cc8e2c99ce9ac7e01265e31ceb8e47bf9c37f46f8abbd
*/
  /*eslint-disable */
  const pubkeyParent =
    "045d4a72237572a91e13818fa38cedabe6174569cc9a319012f75150d5c0a0639d54eafd13a68d079b7a67764800c6a981825ef52384f08c3925109188ab21bc09";
  const addrParent = Buffer.from(
    "1NjiCsVBuKDT62LmaUd7WZZZBK2gPAkisb",
    "ascii"
  ).toString("hex");
  const ccParent =
    "8bd937d416de7020952cc8e2c99ce9ac7e01265e31ceb8e47bf9c37f46f8abbd";
  const responseParent = `41${pubkeyParent}22${addrParent}${ccParent}`;

  const pubkeyAcc =
    "04250dfdfb84c1efd160ed0e10ebac845d0e4b04277174630ba56de96bbd3afb21fc6c04ce0d5a0cbd784fdabc99d16269c27cf3842fe8440f1f21b8af900f0eaa";
  const addrAcc = Buffer.from(
    "16Y97ByhyboePhTYMMmFj1tq5Cy1bDq8jT",
    "ascii"
  ).toString("hex");
  const ccAcc =
    "c071c6f2d05cbc9ea9a04951b238086ce1608cf00020c3cab85b36aac5fdd591";
  /*eslint-enable */
  const responseAcc = `41${pubkeyAcc}22${addrAcc}${ccAcc}`;
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0107426974636f696e06312e332e323301029000
    => e040000009028000002c80000000
    <= ${responseParent}9000
    => e04000000d038000002c8000000080000011
    <= ${responseAcc}9000
    `)
  );
  const btc = new Btc(transport);
  const result = await btc.getWalletXpub({
    path: "44'/0'/17'",
    xpubVersion: 0x043587cf, // mainnet
  });
  const expectedXpub =
    "tpubDDn3XrB65rhCzRh4fsD8gogX9gFvGcEmP3jZtGbdxK7Mn25gipFB68vLFyqZ43i4e5Z7p6rki7THyb2PeH1D3NkLm5EUFzbUzyafp872GKa";
  expect(result).toEqual(expectedXpub);
});

test("btc.getWalletPublicKey", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
      => b001000000
      <= 0107426974636f696e06312e332e323301029000
      => e040000011048000002c800000008000000000000000
      <= 410486b865b52b753d0a84d09bc20063fab5d8453ec33c215d4019a5801c9c6438b917770b2782e29a9ecc6edb67cd1f0fbf05ec4c1236884b6d686d6be3b1588abb2231334b453654666641724c683466564d36756f517a7673597135767765744a63564dbce80dd580792cd18af542790e56aa813178dc28644bb5f03dbd44c85f2d2e7a9000
    `)
  );
  const btc = new Btc(transport);
  const result = await btc.getWalletPublicKey("44'/0'/0'/0");
  expect(result).toEqual({
    bitcoinAddress: "13KE6TffArLh4fVM6uoQzvsYq5vwetJcVM",
    chainCode:
      "bce80dd580792cd18af542790e56aa813178dc28644bb5f03dbd44c85f2d2e7a",
    publicKey:
      "0486b865b52b753d0a84d09bc20063fab5d8453ec33c215d4019a5801c9c6438b917770b2782e29a9ecc6edb67cd1f0fbf05ec4c1236884b6d686d6be3b1588abb",
  });
});

test("btc 2", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0107426974636f696e06312e332e323301029000
    => b001000000
    <= 0107426974636f696e06312e332e323301029000
    => e042000009000000010100000001
    <= 9000
    => e0428000254ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a
    <= 9000
    => e04280003247304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f
    <= 9000
    => e04280003257c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7
    <= 9000
    => e04280002a325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff
    <= 9000
    => e04280000102
    <= 9000
    => e04280002281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac
    <= 9000
    => e042800022a0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac
    <= 9000
    => e04280000400000000
    <= 32005df4c773da236484dae8f0fdba3d7e0ba1d05070d1a34fc44943e638441262a04f1001000000a086010000000000b890da969aa6f3109000
    => e04000000d03800000000000000000000000
    <= 41046666422d00f1b308fc7527198749f06fedb028b979c09f60d0348ef79c985e4138b86996b354774c434488d61c7fb20a83293ef3195d422fde9354e6cf2a74ce223137383731457244716465764c544c57424836577a6a556331454b4744517a434d41612d17bc55b7aa153ae07fba348692c2976e6889b769783d475ba7488fb547709000
    => e0440000050100000001
    <= 9000
    => e04480003b013832005df4c773da236484dae8f0fdba3d7e0ba1d05070d1a34fc44943e638441262a04f1001000000a086010000000000b890da969aa6f31019
    <= 9000
    => e04480001d76a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88acffffffff
    <= 9000
    => e04a80002301905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac
    <= 00009000
    => e04800001303800000000000000000000000000000000001
    <= 3145022100ff492ad0b3a634aa7751761f7e063bf6ef4148cd44ef8930164580d5ba93a17802206fac94b32e296549e2e478ce806b58d61cfacbfed35ac4ceca26ac531f92b20a019000
    `)
  );
  const btc = new Btc(transport);
  const tx1 = btc.splitTransaction(
    "01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000"
  );
  const result = await btc.createPaymentTransactionNew({
    inputs: [[tx1, 1, undefined, undefined]],
    associatedKeysets: ["0'/0/0"],
    changePath: undefined,
    outputScriptHex:
      "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac",
    additionals: [],
  });
  expect(result).toEqual(
    "0100000001c773da236484dae8f0fdba3d7e0ba1d05070d1a34fc44943e638441262a04f10010000006b483045022100ff492ad0b3a634aa7751761f7e063bf6ef4148cd44ef8930164580d5ba93a17802206fac94b32e296549e2e478ce806b58d61cfacbfed35ac4ceca26ac531f92b20a0121026666422d00f1b308fc7527198749f06fedb028b979c09f60d0348ef79c985e41ffffffff01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac00000000"
  );
});

test("btc 3", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => e042000009000000010100000001
    <= 9000
    => e0428000254ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a
    <= 9000
    => e04280003247304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f
    <= 9000
    => e04280003257c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7
    <= 9000
    => e04280002a325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff
    <= 9000
    => e04280000102
    <= 9000
    => e04280002281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac
    <= 9000
    => e042800022a0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac
    <= 9000
    => e04280000400000000
    <= 3200e4eac773da236484dae8f0fdba3d7e0ba1d05070d1a34fc44943e638441262a04f1001000000a086010000000000c79483cc9a6e96fe9000
    => e0440000050100000001
    <= 9000
    => e04480002600c773da236484dae8f0fdba3d7e0ba1d05070d1a34fc44943e638441262a04f100100000069
    <= 9000
    => e04480003252210289b4a3ad52a919abd2bdd6920d8a6879b1e788c38aa76f0440a6f32a9f1996d02103a3393b1439d1693b063482c04b
    <= 9000
    => e044800032d40142db97bdf139eedd1b51ffb7070a37eac321030b9a409a1e476b0d5d17b804fcdb81cf30f9b99c6f3ae1178206e08bc5
    <= 9000
    => e04480000900639853aeffffffff
    <= 9000
    => e04a80002301905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac
    <= 00009000
    => e04800001303800000000000000000000000000000000001
    <= 3045022100b5b1813992282b9a1fdd957b9751d79dc21018abc6586336e272212cc89cfe84022053765a1da0bdb5a0631a9866f1fd4c583589d5188b11cfa302fc20cd2611a71e019000
    `)
  );
  const btc = new Btc(transport);
  const tx1 = btc.splitTransaction(
    "01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000"
  );
  const result = await btc.signP2SHTransaction({
    inputs: [
      [
        tx1,
        1,
        "52210289b4a3ad52a919abd2bdd6920d8a6879b1e788c38aa76f0440a6f32a9f1996d02103a3393b1439d1693b063482c04bd40142db97bdf139eedd1b51ffb7070a37eac321030b9a409a1e476b0d5d17b804fcdb81cf30f9b99c6f3ae1178206e08bc500639853ae",
        undefined,
      ],
    ],
    associatedKeysets: ["0'/0/0"],
    outputScriptHex:
      "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac",
  });
  expect(result).toEqual([
    "3045022100b5b1813992282b9a1fdd957b9751d79dc21018abc6586336e272212cc89cfe84022053765a1da0bdb5a0631a9866f1fd4c583589d5188b11cfa302fc20cd2611a71e",
  ]);
});

test("btc 4", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => e04e000117048000002c800000008000000000000000000474657374
    <= 00009000
    => e04e80000100
    <= 3045022100e32b32b8a6b4228155ba4d1a536d8fed9900606663fbbf4ea420ed8e944f9c18022053c97c74d2f6d8620d060584dc7886f5f3003684bb249508eb7066215172281a9000
    `)
  );
  const btc = new Btc(transport);
  const result = await btc.signMessageNew(
    "44'/0'/0'/0",
    Buffer.from("test").toString("hex")
  );
  expect(result).toEqual({
    r: "e32b32b8a6b4228155ba4d1a536d8fed9900606663fbbf4ea420ed8e944f9c18",
    s: "53c97c74d2f6d8620d060584dc7886f5f3003684bb249508eb7066215172281a",
    v: 0,
  });
});

test("btc seg multi", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => b001000000
    <= 0107426974636f696e06312e332e323301029000
    => b001000000
    <= 0107426974636f696e06312e332e323201029000
    => e040000015058000003180000001800000050000000000000000
    <= 4104f004370a593b3cde1511801a1151c86dd09a2f246a3f9ac3ef0b0240c0aeb506feddb0a785f5039c3e3e829db9692364e333256284d0fe312177cb12b88551162131764a4336523431416334685a61704a7863334c5a6e69334e7169445837514562141c248b44b74cbe35a3a92801cfebaf895df8d65f5830264097260c863fc1e59000
    => e040000015058000003180000001800000050000000000000000
    <= 4104f004370a593b3cde1511801a1151c86dd09a2f246a3f9ac3ef0b0240c0aeb506feddb0a785f5039c3e3e829db9692364e333256284d0fe312177cb12b88551162131764a4336523431416334685a61704a7863334c5a6e69334e7169445837514562141c248b44b74cbe35a3a92801cfebaf895df8d65f5830264097260c863fc1e59000
    => e0440002050100000002
    <= 9000
    => e04480022e02f5f6920fea15dda9c093b565cecbe8ba50160071d9bc8bc3474e09ab25a3367d00000000c03b47030000000000
    <= 9000
    => e044800204ffffffff
    <= 9000
    => e04480022e023b9b487a91eee1293090cc9aba5acdde99e562e55b135609a766ffec4dd1100a0000000080778e060000000000
    <= 9000
    => e044800204ffffffff
    <= 9000
    => e04a80002101ecd3e7020000000017a9142397c9bb7a3b8a08368a72b3e58c7bb85055579287
    <= 00009000
    => e0440080050100000001
    <= 9000
    => e04480802e02f5f6920fea15dda9c093b565cecbe8ba50160071d9bc8bc3474e09ab25a3367d00000000c03b47030000000019
    <= 9000
    => e04480801d76a9140a146582553b2f5537e13cef6659e82ed8f69b8f88acffffffff
    <= 9000
    => e04800001b058000003180000001800000050000000000000000000000000001
    <= 30440220081d5f82ec23759eaf93519819faa1037faabdc27277c8594f5e8e2ba04cb24502206dfff160629ef1fbae78c74d59bfa8c7d59f873c905b196cf2e3efa2273db988019000
    => e0440080050100000001
    <= 9000
    => e04480802e023b9b487a91eee1293090cc9aba5acdde99e562e55b135609a766ffec4dd1100a0000000080778e060000000019
    <= 9000
    => e04480801d76a9140a146582553b2f5537e13cef6659e82ed8f69b8f88acffffffff
    <= 9000
    => e04800001b058000003180000001800000050000000000000000000000000001
    <= 3145022100c820c90ce84c6567617733cd6409c4b8f7469b863d811a3cdc73bf3fa43912bc0220320b7fd259939a6821d371f2b49a755d1ca588bffb1476fbb2da68907427b54b019000
    `)
  );
  const btc = new Btc(transport);
  const tx1 = btc.splitTransaction(
    "0100000000010130992c1559a43de1457f23380fefada09124d22594bbeb46ab6e9356e8407d39010000001716001417507f91a6594df7367a0561e4d3df376a829e1fffffffff02c03b47030000000017a9142397c9bb7a3b8a08368a72b3e58c7bb850555792875f810acf0900000017a914813a2e6c7538f0d0afbdeb5db38608804f5d76ab8702483045022100e09ca8a5357623438daee5b7804e73c9209de7c645efd405f13f83420157c48402207d3e4a30f362e062e361967c7afdd45e7f21878a067b661a6635669e620f99910121035606550fd51f6b063b69dc92bd182934a34463f773222743f300d3c7fd3ae47300000000",
    true
  );
  const tx2 = btc.splitTransaction(
    "0100000000010176ef6abce7feecefbe1322da6cd21245f2d475a1836f13e99f56847bf7127f7c0100000017160014a4e29e297768fccd19cabc21cced93a6afc803eeffffffff0280778e060000000017a9142397c9bb7a3b8a08368a72b3e58c7bb8505557928795061b51b100000017a914c5cfa33e119f60c7cb40bd6b9cfe9e78b026eb6a8702473044022031f0c72683374275328ef0341ed1f233c55a37e21335f9c111c25645b50d0d4e0220670b833be0f688c237bf4466d2b94c99631ada3557c95a7d13bfbb9177125c340121020879f8616da54f8ac5476b97fbe0329c5a0e4cbd32e22e7348262bdfad99a44200000000",
    true
  );
  const result = await btc.createPaymentTransactionNew({
    inputs: [
      [tx1, 0, undefined, undefined],
      [tx2, 0, undefined, undefined],
    ],
    associatedKeysets: ["49'/1'/5'/0/0", "49'/1'/5'/0/0"],
    changePath: undefined,
    outputScriptHex:
      "01ecd3e7020000000017a9142397c9bb7a3b8a08368a72b3e58c7bb85055579287",
    segwit: true,
    additionals: [],
  });
  expect(result).toEqual(
    "01000000000102f5f6920fea15dda9c093b565cecbe8ba50160071d9bc8bc3474e09ab25a3367d00000000171600140a146582553b2f5537e13cef6659e82ed8f69b8fffffffff3b9b487a91eee1293090cc9aba5acdde99e562e55b135609a766ffec4dd1100a00000000171600140a146582553b2f5537e13cef6659e82ed8f69b8fffffffff01ecd3e7020000000017a9142397c9bb7a3b8a08368a72b3e58c7bb85055579287024730440220081d5f82ec23759eaf93519819faa1037faabdc27277c8594f5e8e2ba04cb24502206dfff160629ef1fbae78c74d59bfa8c7d59f873c905b196cf2e3efa2273db988012102f004370a593b3cde1511801a1151c86dd09a2f246a3f9ac3ef0b0240c0aeb50602483045022100c820c90ce84c6567617733cd6409c4b8f7469b863d811a3cdc73bf3fa43912bc0220320b7fd259939a6821d371f2b49a755d1ca588bffb1476fbb2da68907427b54b012102f004370a593b3cde1511801a1151c86dd09a2f246a3f9ac3ef0b0240c0aeb50600000000"
  );
});

test("btc sign p2sh seg", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => e0440002050100000001
    <= 9000
    => e04480022e021ba3852a59cded8d2760434fa75af58a617b21e4fbe1cf9c826ea2f14f80927d00000000102700000000000000
    <= 9000
    => e044800204ffffffff
    <= 9000
    => e04a8000230188130000000000001976a9140ae1441568d0d293764a347b191025c51556cecd88ac
    <= 00009000
    => e0440080050100000001
    <= 9000
    => e04480802e021ba3852a59cded8d2760434fa75af58a617b21e4fbe1cf9c826ea2f14f80927d00000000102700000000000047
    <= 9000
    => e0448080325121026666422d00f1b308fc7527198749f06fedb028b979c09f60d0348ef79c985e41210384257cf895f1ca492bbee5d748
    <= 9000
    => e0448080195ae0ef479036fdf59e15b92e37970a98d6fe7552aeffffffff
    <= 9000
    => e04800001303800000000000000000000000000000000001
    <= 3045022100932934ee326c19c81b72fb03cec0fb79ff980a8076639f77c7edec35bd59da1e02205e4030e8e0fd2405f6db2fe044c49d3f191adbdc0e05ec7ed4dcc4c6fe7310e5019000
    `)
  );
  const btc = new Btc(transport);
  const tx1 = btc.splitTransaction(
    "0100000001d3a05cd6e15582f40e68bb8b1559dc9e5b3e4f9f34d92c1217dc8c3355bc844e010000008a47304402207ab1a4768cbb036d4bce3c4a294c13cc5ae6076fc7bedce88c62aa80ae366da702204f8fea6923f8df36315c0c26cb42d8d7ab52ca4736776816e10d6ce51906d0600141044289801366bcee6172b771cf5a7f13aaecd237a0b9a1ff9d769cabc2e6b70a34cec320a0565fb7caf11b1ca2f445f9b7b012dda5718b3cface369ee3a034ded6ffffffff02102700000000000017a9141188cc3c265fbc01a025fc8adec9823effd0cef187185f9265170100001976a9140ae1441568d0d293764a347b191025c51556cecd88ac00000000",
    true
  );
  const result = await btc.signP2SHTransaction({
    inputs: [
      [
        tx1,
        0,
        "5121026666422d00f1b308fc7527198749f06fedb028b979c09f60d0348ef79c985e41210384257cf895f1ca492bbee5d7485ae0ef479036fdf59e15b92e37970a98d6fe7552ae",
        undefined,
      ],
    ],
    associatedKeysets: ["0'/0/0"],
    outputScriptHex:
      "0188130000000000001976a9140ae1441568d0d293764a347b191025c51556cecd88ac",
    segwit: true,
  });
  expect(result).toEqual([
    "3045022100932934ee326c19c81b72fb03cec0fb79ff980a8076639f77c7edec35bd59da1e02205e4030e8e0fd2405f6db2fe044c49d3f191adbdc0e05ec7ed4dcc4c6fe7310e501",
  ]);
});

test("signMessage", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
    => e04e00011d058000002c800000008000000000000000000000000006666f6f626172
    <= 00009000
    => e04e80000100
    <= 314402205eac720be544d3959a760d9bfd6a0e7c86d128fd1030038f06d85822608804e20220385d83273c9d03c469596292fb354b07d193034f83c2633a4c1f057838e12a5b9000
    `)
  );
  const btc = new Btc(transport);
  const res = await btc.signMessageNew(
    "44'/0'/0'/0/0",
    Buffer.from("foobar").toString("hex")
  );
  expect(res).toEqual({
    v: 1,
    r: "5eac720be544d3959a760d9bfd6a0e7c86d128fd1030038f06d85822608804e2",
    s: "385d83273c9d03c469596292fb354b07d193034f83c2633a4c1f057838e12a5b",
  });
});

function testBackend(s: string): any {
  return async () => {
    return { publicKey: s, bitcoinAddress: "", chainCode: "" };
  };
}

class TestBtc extends Btc {
  n: BtcNew;
  o: BtcOld;
  constructor(public tr: Transport) {
    super(tr);
    this.n = new BtcNew(new TestingClient(tr));
    this.n.getWalletPublicKey = testBackend("new");
    this.o = new BtcOld(tr);
    this.o.getWalletPublicKey = testBackend("old");
  }
  protected new(): BtcNew {
    return this.n;
  }
  protected old(): BtcOld {
    return this.o;
  }
}

// test.each`
// a    | b    | expected
// ${1} | ${1} | ${2}
// ${1} | ${2} | ${3}
// ${2} | ${1} | ${3}
// `('returns $expected when $a is added $c', ({ a, c, expected }) => {
//   expect(a + c).toBe(expected);
// });

test.each`
  app          | ver               | path                 | format       | display      | exp
  ${"Bitcoin"} | ${"1.99.99"}      | ${"m/44'/0'/1'"}     | ${"bech32m"} | ${false}     | ${""}
  ${"Bitcoin"} | ${"1.99.99"}      | ${"m/44'/0'"}        | ${"bech32m"} | ${false}     | ${""}
  ${"Bitcoin"} | ${"2.0.0-alpha1"} | ${"m/44'/0'/1'"}     | ${"bech32m"} | ${false}     | ${"new"}
  ${"Bitcoin"} | ${"2.0.0-alpha1"} | ${"m/44'/0'"}        | ${"bech32m"} | ${false}     | ${"new"}
  ${"Bitcoin"} | ${"2.0.0-beta"}   | ${"m/84'/1'/0'"}     | ${"bech32"}  | ${false}     | ${"new"}
  ${"Bitcoin"} | ${"2.0.0-alpha1"} | ${"m/44'/0'/1'"}     | ${"bech32"}  | ${false}     | ${"new"}
  ${"Bitcoin"} | ${"2.0.0-alpha1"} | ${"m/44'/0'"}        | ${"bech32"}  | ${undefined} | ${"old"}
  ${"Bitcoin"} | ${"2.0.0-alpha1"} | ${"m/44'/0'"}        | ${"bech32"}  | ${true}      | ${"new"}
  ${"Bitcoin"} | ${"2.0.0-alpha1"} | ${"m/44'/0'/1'/0/0"} | ${"bech32"}  | ${false}     | ${"new"}
  ${"Bitcoin"} | ${"2.0.0-alpha1"} | ${"m/44'/0'/1'/1/0"} | ${"bech32"}  | ${false}     | ${"new"}
  ${"Bitcoin"} | ${"2.0.0-alpha1"} | ${"m/44'/0'/1'/1/0"} | ${"legacy"}  | ${false}     | ${"new"}
  ${"Bitcoin"} | ${"2.0.0-alpha1"} | ${"m/44'/0'/1'/1/0"} | ${"p2sh"}    | ${false}     | ${"new"}
  ${"Bitcoin"} | ${"2.0.0-alpha1"} | ${"m/44'/0'/1'/2/0"} | ${"bech32"}  | ${false}     | ${"old"}
`(
  "dispatch $app $ver $path $format $display to $exp",
  async ({ app, ver, path, format, display, exp }) => {
    const appName = Buffer.from([app.length])
      .toString("hex")
      .concat(Buffer.from(app, "ascii").toString("hex"));
    const appVersion = Buffer.from([ver.length])
      .toString("hex")
      .concat(Buffer.from(ver, "ascii").toString("hex"));
    const resp = `01${appName}${appVersion}01029000`;
    const tr = await openTransportReplayer(
      RecordStore.fromString(`=> b001000000\n <= ${resp}`)
    );
    const btc = new TestBtc(tr);
    try {
      const key = await btc.getWalletPublicKey(path, {
        format: format,
        verify: display,
      });
      if (exp === "") {
        expect(1).toEqual(0); // Allways fail. Don't know how to do that properly
      }
      expect(key.publicKey).toEqual(exp);
    } catch (e: any) {
      if (exp != "") {
        throw e;
      }
      expect(exp).toEqual("");
    }
  }
);

// test("getWalletPublicKey compatibility for internal hardened keys", async () => {
//   await testDispatch("Bitcoin", "1.99.99", "m/44'/0'/1'", "bech32m", "");
//   await testDispatch("Bitcoin", "1.99.99", "m/44'/0'", "bech32m", "");
//   await testDispatch("Bitcoin", "2.0.0-alpha1", "m/44'/0'/1'", "bech32m", "new");
//   await testDispatch("Bitcoin", "2.0.0-alpha1", "m/44'/0'", "bech32m", "new");
//   await testDispatch("Bitcoin", "2.0.0-alpha1", "m/44'/0'/1'", "bech32", "new");
//   await testDispatch("Bitcoin", "2.0.0-alpha1", "m/44'/0'", "bech32", "old");
// });

async function testDispatch(
  name: string,
  version: string,
  path: string,
  addressFormat: AddressFormat | undefined,
  exp: string
): Promise<void> {}
