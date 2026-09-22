// ESM that Jest cannot parse, over a native runtime. Mapped, not jest.mock'd: pnpm resolves
// one copy per peer set.
export const scrypt = jest.fn(async (_passwd: Uint8Array, _salt: Uint8Array, ...rest: number[]) => {
  const size = rest[rest.length - 1] ?? 32;
  return new Uint8Array(size).fill(7);
});

export const secp256k1 = {
  publicKeyTweakAdd: jest.fn(async (publicKey: Uint8Array) => publicKey),
};
