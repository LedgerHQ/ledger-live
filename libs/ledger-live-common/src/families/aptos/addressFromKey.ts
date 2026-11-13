import { sha3_256 } from "@noble/hashes/sha3";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

/** The address of a single-signer Ed25519 account: its authentication key, sha3(key ‖ 0x00). */
export default (publicKey: string): string =>
  `0x${bytesToHex(sha3_256(new Uint8Array([...hexToBytes(publicKey), 0])))}`;
