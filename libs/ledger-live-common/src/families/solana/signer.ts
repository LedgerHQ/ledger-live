import Transport from "@ledgerhq/hw-transport";
import type { Resolution } from "@ledgerhq/coin-solana/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { CreateSigner, executeWithSigner } from "../../bridge/setup";
import { canDMKSignerBeUsed, getSolanaSignerInstance } from "./setup";
import bs58 from "bs58";
import { VersionedTransaction } from "@solana/web3.js";

/**
 * The framework passes `getAddress` an options object, `hw-app-solana` a boolean `display`, and
 * `SignerContext` erases the shape: forwarding the object would set P1=0x01 mid-signing.
 */
export type SolanaSigner = {
  getAddress: (
    path: string,
    verify?: boolean | { verify?: boolean; derivationMode?: string },
  ) => Promise<{ address: Buffer; publicKey: string }>;
  signTransaction: (path: string, txBase64: string, resolution?: Resolution) => Promise<string>;
};

export const createSigner: CreateSigner<SolanaSigner> = (transport: Transport) => {
  const signer = getSolanaSignerInstance(transport);
  const isDmk = canDMKSignerBeUsed(transport);
  return {
    getAddress: async (path: string, verify?: boolean | { verify?: boolean }) => {
      const display = typeof verify === "boolean" ? verify : !!verify?.verify;
      const { address } = await signer.getAddress(path, display);
      return { address, publicKey: bs58.encode(address) };
    },
    signTransaction: async (path: string, txBase64: string, resolution?: Resolution) => {
      // The crafted payload carries the signature vector too; the device signs the message alone.
      const { message } = VersionedTransaction.deserialize(Buffer.from(txBase64, "base64"));
      // `LegacySignerSolana` throws on a resolution with no `deviceModelId`, which is unavailable.
      const { signature } = await signer.signTransaction(
        path,
        Buffer.from(message.serialize()),
        isDmk ? resolution : undefined,
      );
      return signature.toString("hex");
    },
  };
};

export const solanaGetAddress = (signerContext: SignerContext<SolanaSigner>): GetAddressFn => {
  return async (deviceId, { path, verify }) => {
    const { address } = await signerContext(deviceId, signer => signer.getAddress(path, verify));
    const publicKey = bs58.encode(address);
    return { address: publicKey, publicKey, path };
  };
};

const context = executeWithSigner(createSigner);
const getAddress = solanaGetAddress(context);

export default {
  context,
  getAddress,
} satisfies CoinFrameworkSigner;
