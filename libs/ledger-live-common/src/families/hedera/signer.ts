import Hedera from "@ledgerhq/hw-app-hedera";
import Transport from "@ledgerhq/hw-transport";
import { deserializeTransaction, getHederaTransactionBodyBytes } from "@ledgerhq/coin-hedera/logic/utils";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { CreateSigner, executeWithSigner } from "../../bridge/setup";

export type HederaFamilySigner = {
  getPublicKey(path: string): Promise<string>;
  // genericSignOperation/signRawOperation call .getAddress directly on the raw device-signer
  // instance (mirrors coin-stacks, coin-tezos), so it's added here on top of getPublicKey.
  getAddress(path: string): Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction(path: string, unsignedTxHex: string, options?: unknown): Promise<string>;
};

export const createSignerHedera: CreateSigner<HederaFamilySigner> = (transport: Transport) => {
  const hedera = new Hedera(transport);
  return {
    getPublicKey: (path: string) => hedera.getPublicKey(path),
    getAddress: async (path: string) => {
      const publicKey = await hedera.getPublicKey(path);
      // NOTE: Hedera has no derivable address; the public key doubles as the "address".
      return { path, address: publicKey, publicKey };
    },
    // TODO(prototype, GAP E): hw-app-hedera's signTransaction takes neither a path nor options —
    // it signs from account index 0 only (hw-app-hedera/src/Hedera.ts:56-58). A production signer
    // should reject a non-zero account index instead of silently dropping it.
    signTransaction: async (_path: string, unsignedTxHex: string) => {
      // `unsignedTxHex` is the full SDK envelope (`Transaction.toBytes()`) — `combine()` needs that
      // whole structure to inject the signature back in later. The device app only accepts the bare
      // `TransactionBody` bytes inside it (sending the envelope gets CLA_NOT_SUPPORTED), so unwrap
      // here, the same way the legacy bridge's `bridge/signOperation.ts` already does.
      const tx = deserializeTransaction(unsignedTxHex);
      const bodyBytes = getHederaTransactionBodyBytes(tx);
      const signature = await hedera.signTransaction(bodyBytes);
      return Buffer.from(signature).toString("base64");
    },
  };
};

export const hederaGetAddress = (
  signerContext: SignerContext<HederaFamilySigner>,
): GetAddressFn => {
  return async (deviceId, { path }) => {
    const publicKey = await signerContext(deviceId, signer => signer.getPublicKey(path));
    return {
      path,
      // NOTE: Hedera has no derivable address; the public key doubles as the "address"
      // (mirrors @ledgerhq/coin-hedera/signer/getAddress.ts, the legacy bridge's resolver).
      address: publicKey,
      publicKey,
    };
  };
};

const context = executeWithSigner(createSignerHedera);
const getAddress = hederaGetAddress(context);

export default {
  context,
  getAddress,
} satisfies CoinFrameworkSigner;
