import { toChecksumAddress } from "@zilliqa-js/crypto";

import * as bech32 from "bech32";
const HRP = "zil";

export function fromBech32(value: string): string {
  let decoded;

  try {
    decoded = bech32.decode(value);
  } catch (err) {
    throw new Error("Zilliqa address cannot be decoded.");
  }

  const prefix = decoded.prefix;
  if (prefix != HRP) {
    throw new Error("HPR mismatch: This is not a Zilliqa address.");
  }

  const pubkey = Buffer.from(bech32.fromWords(decoded.words));

  return toChecksumAddress("0x" + pubkey.toString("hex"));
}

export function toBech32(pubkey: string): string {
  if (pubkey.substring(0, 2) === "0x") {
    pubkey = pubkey.substring(2, pubkey.length);
  }

  const payload = Buffer.from(pubkey, "hex");
  const words = bech32.toWords(payload);

  return bech32.encode(HRP, words);
}
