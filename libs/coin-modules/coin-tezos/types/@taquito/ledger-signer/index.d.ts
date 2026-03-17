declare module "@taquito/ledger-signer/dist/lib/utils" {
  export function compressPublicKey(publicKey: Uint8Array, derivationType?: number): Buffer;
}
