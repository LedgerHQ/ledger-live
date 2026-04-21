// ─── api ──────────────────────────────────────────────────────────────────────
import { createApi as createXrpApi } from "@ledgerhq/coin-xrp/api/index";
import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";
import type { AlpacaApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../../config";

// ─── signer ───────────────────────────────────────────────────────────────────
import resolver from "../../../families/xrp/getAddress";
import { executeWithSigner } from "../../setup";
import type { AlpacaSigner } from "../types";
import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport";

export function createApi(currencyId: string): AlpacaApi<any> & BridgeApi {
  return createXrpApi(
    getCurrencyConfiguration<XrpCoinConfig>(currencyId),
  ) as AlpacaApi<any> & BridgeApi;
}

export const createSigner = (transport: Transport) => {
  const xrp = new Xrp(transport);
  const originalGetAddress = xrp.getAddress.bind(xrp);
  const originalSignTransaction = xrp.signTransaction.bind(xrp);
  return {
    getAddress: async (
      path: string,
      options?: boolean | { verify?: boolean; derivationMode?: string },
      chainCode?: boolean,
      ed25519?: boolean,
    ) => {
      const display = typeof options === "boolean" ? options : Boolean(options?.verify);
      const extra = [chainCode, ed25519].filter((v): v is boolean => v !== undefined);
      return originalGetAddress(path, display, ...(extra as [boolean?, boolean?]));
    },
    signTransaction: async (path: string, rawTxHex: string, ed25519?: boolean) => {
      return originalSignTransaction(path, rawTxHex, ed25519);
    },
  };
};

const context = executeWithSigner(createSigner);

export const signer = {
  context,
  getAddress: resolver(context),
} satisfies AlpacaSigner;
