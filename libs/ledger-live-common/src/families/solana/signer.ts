import Transport from "@ledgerhq/hw-transport";
import { DmkSignerSol, LegacySignerSolana } from "@ledgerhq/live-signer-solana";
import type { SolanaSigner as CoinSolanaSigner } from "@ledgerhq/coin-solana/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { CreateSigner, executeWithSigner } from "../../bridge/setup";
import { isDmkTransport } from "../../hw/dmkUtils";
import bs58 from "bs58";

/**
 * The generic coin framework calls `getAddress` with an options object rather than a boolean, and
 * reads `publicKey` off the result; `hw-app-solana` takes a boolean `display` and returns only the
 * raw address. `SignerContext<S>` erases the signer's shape at the framework's call sites, so a
 * mismatch is not a type error but a runtime one: forwarding the options object straight into
 * `display` sets P1=0x01, which makes the app ask the user to verify their address in the middle
 * of signing.
 */
export type SolanaSigner = {
  getAddress: (
    path: string,
    verify?: boolean | { verify?: boolean; derivationMode?: string },
  ) => Promise<{ address: Buffer; publicKey: string }>;
  signTransaction: (path: string, txBase64: string) => Promise<string>;
};

const createLiveSigner: CreateSigner<CoinSolanaSigner> = (transport: Transport) => {
  if (isDmkTransport(transport)) {
    return new DmkSignerSol(transport.dmk, transport.sessionId);
  }

  return new LegacySignerSolana(transport);
};

export const createSigner: CreateSigner<SolanaSigner> = (transport: Transport) => {
  const signer = createLiveSigner(transport);
  return {
    getAddress: async (path: string, verify?: boolean | { verify?: boolean }) => {
      const display = typeof verify === "boolean" ? verify : !!verify?.verify;
      const { address } = await signer.getAddress(path, display);
      return { address, publicKey: bs58.encode(address) };
    },
    signTransaction: async (path: string, txBase64: string) => {
      const txBuffer = Buffer.from(txBase64, "base64");
      const { signature } = await signer.signTransaction(path, txBuffer);
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
