import { buildTransferBody } from "@ledgerhq/coin-ton/logic/transferBody";
import type { TonSigner } from "@ledgerhq/coin-ton/signer";
import { Cell, beginCell, comment } from "@ton/core";
import { type KeyPair, keyPairFromSeed, sha256_sync, sign } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";

/**
 * Plays the device for the generic adapter. `signTransaction` gets coin-ton's crafted wallet-v4
 * body (BOC, base64) and returns the ed25519 signature over its hash, which `combine` checks
 * against the public key: the Ledger app signs the same hash.
 */
export type TonSoftwareSigner = {
  getAddress: (path: string) => Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction: (path: string, unsigned: string) => Promise<string>;
};

/** One key per derivation path, the same on every run. */
export const keyPairAt = (path: string): KeyPair =>
  keyPairFromSeed(sha256_sync(`coin-tester-ton/${path}`));

/** The v4 wallet of the key at `path`, in the non-bounceable form Ledger Live shows. */
export const walletAt = (path: string) =>
  WalletContractV4.create({ workchain: 0, publicKey: keyPairAt(path).publicKey });

export const friendlyAddressAt = (path: string): string =>
  walletAt(path).address.toString({ urlSafe: true, bounceable: false });

export function buildSigner(): TonSoftwareSigner {
  return {
    getAddress: async path => ({
      path,
      address: friendlyAddressAt(path),
      publicKey: keyPairAt(path).publicKey.toString("hex"),
    }),
    signTransaction: async (path, unsigned) =>
      sign(Cell.fromBase64(unsigned).hash(), keyPairAt(path).secretKey).toString("hex"),
  };
}

const pathOf = (ledgerPath: number[]): string => ledgerPath.map(index => `${index}'`).join("/");

/**
 * Plays the device for the legacy bridge: it signs the body the Ledger app rebuilds from the
 * transaction and returns it signed, as `@ton-community/ton-ledger` does.
 */
export function buildLegacySigner(): TonSigner {
  const getAddress = async (ledgerPath: number[]) => ({
    address: friendlyAddressAt(pathOf(ledgerPath)),
    publicKey: keyPairAt(pathOf(ledgerPath)).publicKey,
  });
  return {
    getAddress,
    validateAddress: getAddress,
    signTransaction: async (ledgerPath, transaction) => {
      const { payload } = transaction;
      if (payload && payload.type !== "comment") {
        throw new Error(`The software signer does not sign ${payload.type} payloads`);
      }
      const body = buildTransferBody({
        seqno: transaction.seqno,
        validUntil: transaction.timeout,
        sendMode: transaction.sendMode,
        to: transaction.to,
        bounce: transaction.bounce,
        amount: transaction.amount,
        payload: payload ? comment(payload.text) : null,
      });
      const signature = sign(body.hash(), keyPairAt(pathOf(ledgerPath)).secretKey);
      return beginCell().storeBuffer(signature).storeSlice(body.beginParse()).endCell();
    },
  };
}
