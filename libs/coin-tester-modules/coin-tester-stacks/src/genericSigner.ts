import {
  deserializeTransaction,
  getAddressFromPrivateKey,
  privateKeyToPublic,
  publicKeyToHex,
  TransactionSigner,
} from "@stacks/transactions-v7";

// Only the field this signer reads — `SingleSigSpendingCondition` isn't re-exported from the
// package root, and the coin-tester otherwise has no reason to deep-import `dist/authorization`.
type SingleSigSpendingCondition = { signature?: { data: string } };

/**
 * Generic-adapter (Alpaca) signer contract, mirrors `GetCoinFrameworkAccountBridge`'s expectation
 * (`CoinFrameworkSigner`): `signTransaction(path, unsigned)` receives the hex string
 * `craftTransaction` produced (`coin-stacks/logic/transaction/craftTransaction.ts`'s
 * `transactionToHex(tx)`) and must return the hex-encoded signature `combine` consumes
 * (`coin-stacks/logic/transaction/combine.ts`'s `signature` param).
 *
 * Deliberately targets `@stacks/transactions@7.6.0` (aliased as `@stacks/transactions-v7` in
 * `package.json`, distinct from this package's own pinned v6), unlike `signer.ts`'s legacy
 * signer: `coin-stacks`'s pox-5 staking transactions carry a post-condition type (`ustxToLock`)
 * that v6's `deserializeTransaction` doesn't recognize at all (`DeserializationError: Could not
 * read 3 as PostConditionType`, verified empirically) -- v6 and v7 only interoperate for the
 * plain STX/SIP-010 transfer shapes `signer.ts` actually signs, not for every wire-format feature
 * `coin-stacks` can produce.
 */
export type GenericStacksSigner = {
  getAddress: (path: string) => Promise<{ address: string; publicKey: string }>;
  signTransaction: (path: string, unsigned: string) => Promise<string>;
};

export type StacksGenericTestAccount = {
  address: string;
  publicKey: string;
  signer: GenericStacksSigner;
};

/**
 * Builds a deterministic in-memory generic-adapter signer from a raw secp256k1 private key --
 * same underlying signing logic as `signer.ts`'s legacy `StacksSigner` (both ultimately use
 * `@stacks/transactions`' own `TransactionSigner.signOrigin`, not a reimplemented sighash), only
 * exposed as `signTransaction(path, hex): Promise<string>` instead of the legacy bridge's
 * `sign(path, message: Buffer): Promise<{signatureVRS, ...}>` shape.
 */
export function buildStacksGenericTestSigner(privateKeyHex: string): StacksGenericTestAccount {
  // Devnet uses the same address version as testnet -- see `signer.ts`'s equivalent comment.
  const address = getAddressFromPrivateKey(privateKeyHex, "testnet");
  const publicKey = publicKeyToHex(privateKeyToPublic(privateKeyHex));

  const signer: GenericStacksSigner = {
    async getAddress() {
      return { address, publicKey };
    },
    async signTransaction(_path: string, unsigned: string) {
      const tx = deserializeTransaction(unsigned.replace(/^0x/, ""));
      const txSigner = new TransactionSigner(tx);
      txSigner.signOrigin(privateKeyHex);

      // Always a single-sig standard-principal spending condition in this package's scenarios
      // (STX transfers, SIP-010 calls, and pox-5 stake/unstake all signed by one key) --
      // `MultiSigSpendingCondition` has no `signature` field at all, so this cast is safe for
      // what this signer is ever asked to sign.
      const spendingCondition = tx.auth.spendingCondition as SingleSigSpendingCondition | undefined;
      const signature = spendingCondition?.signature?.data;
      if (!signature) {
        throw new Error("coin-tester-stacks: signOrigin did not produce a signature");
      }

      return signature.replace(/^0x/, "");
    },
  };

  return { address, publicKey, signer };
}
