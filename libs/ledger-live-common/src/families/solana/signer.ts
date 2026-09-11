import Transport from "@ledgerhq/hw-transport";
import type { Resolution } from "@ledgerhq/coin-solana/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { CreateSigner, executeWithSigner } from "../../bridge/setup";
import { canDMKSignerBeUsed, getSolanaSignerInstance } from "./setup";
import bs58 from "bs58";

/**
 * The framework calls `getAddress` with an options object and reads `publicKey`; `hw-app-solana`
 * takes a boolean `display`. `SignerContext` erases the shape, so forwarding the object sets
 * P1=0x01 and asks the user to verify their address mid-signing.
 */
export type SolanaSigner = {
  getAddress: (
    path: string,
    verify?: boolean | { verify?: boolean; derivationMode?: string },
  ) => Promise<{ address: Buffer; publicKey: string }>;
  signTransaction: (path: string, txBase64: string, resolution?: Resolution) => Promise<string>;
};

export const createSigner: CreateSigner<SolanaSigner> = (transport: Transport) => {
  // Through the family's own factory, so the `ldmkSolanaSigner` flag and the transaction-check
  // option it passes stay defined in one place.
  const signer = getSolanaSignerInstance(transport);
  const isDmk = canDMKSignerBeUsed(transport);
  return {
    getAddress: async (path: string, verify?: boolean | { verify?: boolean }) => {
      const display = typeof verify === "boolean" ? verify : !!verify?.verify;
      const { address } = await signer.getAddress(path, display);
      return { address, publicKey: bs58.encode(address) };
    },
    signTransaction: async (path: string, txBase64: string, resolution?: Resolution) => {
      const txBuffer = Buffer.from(txBase64, "base64");
      // `LegacySignerSolana` ignores `templateId` and throws on a resolution carrying no
      // `deviceModelId`, which the framework has no way to supply.
      const { signature } = await signer.signTransaction(
        path,
        txBuffer,
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
