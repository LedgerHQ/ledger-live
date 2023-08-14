// TODO solution for families to expose their own webworkers
// eslint-disable-next-line no-restricted-imports
import { getSecp256k1Instance } from "@ledgerhq/live-common/families/bitcoin/wallet-btc/crypto/secp256k1";

function hexToUint8Array(hex: string) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

function uint8ArrayToHex(arr: Uint8Array) {
  let hex = "";
  for (let i = 0; i < arr.length; i++) {
    hex += arr[i].toString(16).padStart(2, "0");
  }
  return hex;
}

onmessage = (e: MessageEvent<{ publicKey: string; tweak: string; id: string }>) => {
  const { publicKey, tweak, id } = e.data;
  getSecp256k1Instance()
    .publicKeyTweakAdd(hexToUint8Array(publicKey), hexToUint8Array(tweak))
    .then((r: Uint8Array) => {
      postMessage({ response: uint8ArrayToHex(r), id });
    })
    .catch((e: unknown) => {
      console.error(e);
    });
};
