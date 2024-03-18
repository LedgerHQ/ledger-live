// the maximum number of bytes allowed in a single chunk when processing bitcoin script data.
// if the Bitcoin script is too large, we will process it in several chunks.
export const MAX_SCRIPT_BLOCK = 50;
export const DEFAULT_VERSION = 1;
export const DEFAULT_LOCKTIME = 0;
// input sequence for non-rbf transactions
export const DEFAULT_SEQUENCE = 0xffffffff;
// SIGHASH flags(Sign all inputs and outputs)
// refer to https://wiki.bitcoinsv.io/index.php/SIGHASH_flags for more details
export const SIGHASH_ALL = 1;
// refer to https://en.bitcoin.it/wiki/Script for Opcodes(OP_DUP, OP_HASH160...) that are used in bitcoin script
export const OP_DUP = 0x76;
export const OP_HASH160 = 0xa9;
export const HASH_SIZE = 0x14;
export const OP_EQUAL = 0x87;
export const OP_EQUALVERIFY = 0x88;
export const OP_CHECKSIG = 0xac;
export const OP_RETURN = 0x6a;
