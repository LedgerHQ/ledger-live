import Transport from "@ledgerhq/hw-transport";
import { DmkSignerSol, LegacySignerSolana } from "@ledgerhq/live-signer-solana";
import type { SolanaSigner as CoinSolanaSigner } from "@ledgerhq/coin-solana/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CoinFrameworkSigner } from "../../types";
import { CreateSigner, executeWithSigner } from "../../../setup";
import { isDmkTransport } from "../../../../hw/dmkUtils";
import bs58 from "bs58";

export type SolanaSigner = {
  getAddress: (path: string, verify?: boolean) => Promise<{ address: Buffer }>;
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
    getAddress: (path: string, verify?: boolean) =>
      verify !== undefined ? signer.getAddress(path, verify) : signer.getAddress(path),
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
