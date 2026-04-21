// ─── api ──────────────────────────────────────────────────────────────────────
import { createApi as createSolanaApi } from "@ledgerhq/coin-solana/api/index";
import type { AlpacaApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import { getCurrencyConfiguration } from "../../../config";

// ─── signer ───────────────────────────────────────────────────────────────────
import Transport from "@ledgerhq/hw-transport";
import { DmkSignerSol, LegacySignerSolana } from "@ledgerhq/live-signer-solana";
import type { SolanaSigner as CoinSolanaSigner } from "@ledgerhq/coin-solana/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AlpacaSigner } from "../types";
import { CreateSigner, executeWithSigner } from "../../setup";
import { isDmkTransport } from "../../../hw/dmkUtils";
import bs58 from "bs58";

// ─── bridge (no coin-* violations — re-export) ────────────────────────────────
export { default as bridge } from "../families/solana/bridge";

export function createApi(currencyId: string): AlpacaApi<any> & BridgeApi {
  return createSolanaApi(
    getCurrencyConfiguration<SolanaCoinConfig>(currencyId),
    currencyId,
  ) as AlpacaApi<any> & BridgeApi;
}

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
  const liveSigner = createLiveSigner(transport);
  return {
    getAddress: (path: string, verify?: boolean) =>
      verify !== undefined ? liveSigner.getAddress(path, verify) : liveSigner.getAddress(path),
    signTransaction: async (path: string, txBase64: string) => {
      const txBuffer = Buffer.from(txBase64, "base64");
      const { signature } = await liveSigner.signTransaction(path, txBuffer);
      return signature.toString("hex");
    },
  };
};

export const solanaGetAddress = (signerContext: SignerContext<SolanaSigner>): GetAddressFn => {
  return async (deviceId, { path, verify }) => {
    const { address } = await signerContext(deviceId, s => s.getAddress(path, verify));
    const publicKey = bs58.encode(address);
    return { address: publicKey, publicKey, path };
  };
};

const context = executeWithSigner(createSigner);
const getAddress = solanaGetAddress(context);

export const signer = {
  context,
  getAddress,
} satisfies AlpacaSigner;
