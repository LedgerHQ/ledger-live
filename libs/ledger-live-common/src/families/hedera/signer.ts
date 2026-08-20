import Hedera from "@ledgerhq/hw-app-hedera";
import Transport from "@ledgerhq/hw-transport";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { CreateSigner, executeWithSigner } from "../../bridge/setup";

export type HederaFamilySigner = {
  getPublicKey(path: string): Promise<string>;
  signTransaction(path: string, unsignedTxHex: string, options?: unknown): Promise<string>;
};

export const createSignerHedera: CreateSigner<HederaFamilySigner> = (transport: Transport) => {
  const hedera = new Hedera(transport);
  return {
    getPublicKey: (path: string) => hedera.getPublicKey(path),
    // TODO(prototype, GAP E): hw-app-hedera's signTransaction takes neither a path nor options —
    // it signs from account index 0 only (hw-app-hedera/src/Hedera.ts:56-58). A production signer
    // should reject a non-zero account index instead of silently dropping it.
    signTransaction: async (_path: string, unsignedTxHex: string) => {
      const signature = await hedera.signTransaction(Buffer.from(unsignedTxHex, "hex"));
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
