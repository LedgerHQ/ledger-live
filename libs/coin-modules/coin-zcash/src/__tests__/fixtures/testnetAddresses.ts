import { base58check, encodeUnifiedAddress } from "./unifiedAddress";

// Testnet and mainnet fixtures constructed from fixed receiver bytes (never typed
// in by hand), so the expected prefix of each is a property under test.
const hash = new Uint8Array(20).fill(0x2a);
const receiver = (typecode: number, length: number, fill: number) => ({
  typecode,
  data: new Uint8Array(length).fill(fill),
});

export const TM_ADDRESS = base58check(new Uint8Array([0x1d, 0x25, ...hash]));
export const T2_ADDRESS = base58check(new Uint8Array([0x1c, 0xba, ...hash]));
export const T1_MAINNET = base58check(new Uint8Array([0x1c, 0xb8, ...hash]));
export const T3_MAINNET = base58check(new Uint8Array([0x1c, 0xbd, ...hash]));

const orchard = receiver(0x03, 43, 0x07);
export const UTEST_ORCHARD_RECEIVER = orchard;
const sapling = receiver(0x02, 43, 0x05);
const p2pkh = receiver(0x00, 20, 0x09);

export const UTEST_ORCHARD = encodeUnifiedAddress("utest", [orchard]);
export const UTEST_SAPLING_ONLY = encodeUnifiedAddress("utest", [sapling]);
export const UTEST_TRANSPARENT_ONLY = encodeUnifiedAddress("utest", [p2pkh]);
export const UTEST_SAPLING_AND_ORCHARD = encodeUnifiedAddress("utest", [sapling, orchard]);
export const U_ORCHARD_MAINNET = encodeUnifiedAddress("u", [orchard]);
