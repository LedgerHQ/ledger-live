// react-native-fast-crypto ships ESM and bridges to a native module, so a plain node env cannot
// load it. Self-contained doubles rather than the library's own mock, so a flow package needs no
// dependency on it here. Tests that care about the digest override `scrypt` themselves.
module.exports = {
  __esModule: true,
  scrypt: jest.fn(async (_passwd, _salt, _n, _r, _p, size = 32) => new Uint8Array(size).fill(7)),
  secp256k1: { publicKeyTweakAdd: jest.fn(async publicKey => publicKey) },
};
