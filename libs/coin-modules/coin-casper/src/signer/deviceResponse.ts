import { KeyAlgorithm } from "casper-js-sdk";
import { casperAddressFromPubKey } from "../logic/validateAddress";
import type { CasperGetAddrResponse } from "../types";

/** A Casper address is the algorithm-tagged public key. */
export function addressFromDeviceResponse(r: CasperGetAddrResponse): string {
  return r.Address.length
    ? r.Address.toLowerCase()
    : casperAddressFromPubKey(r.publicKey, KeyAlgorithm.SECP256K1);
}

/** The device omits the algorithm tag byte that `combine` and the node expect. */
export function tagSignature(signatureRS: Buffer): string {
  return Buffer.concat([Buffer.from([KeyAlgorithm.SECP256K1]), signatureRS]).toString("hex");
}
