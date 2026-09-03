import Transport from "@ledgerhq/hw-transport";
import resolver from "./getAddress";
import { createSigner as createXrpSigner } from "./setup";
import { executeWithSigner } from "../../bridge/setup";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";

/**
 * Adapts the shapes the generic coin framework calls with onto the `XrpSigner` contract:
 * `getAddress` receives `boolean | { verify?, derivationMode? }` where the signer wants a
 * `display` flag, and `signTransaction` receives the framework's device-options object where
 * the signer wants `ed25519`. Which signer is behind it — DMK or legacy — is `setup.ts`'s call.
 */
export const createSigner = (transport: Transport) => {
  const xrp = createXrpSigner(transport);
  return {
    getAddress: async (
      path: string,
      options?: boolean | { verify?: boolean; derivationMode?: string },
      chainCode?: boolean,
      ed25519?: boolean,
    ) => {
      const display = typeof options === "boolean" ? options : Boolean(options?.verify);
      return xrp.getAddress(path, display, chainCode, ed25519);
    },
    signTransaction: async (
      path: string,
      rawTxHex: string,
      options?: boolean | { derivationMode?: string },
    ) => {
      const ed25519 = typeof options === "boolean" ? options : undefined;
      return xrp.signTransaction(path, rawTxHex, ed25519);
    },
  };
};

const context = executeWithSigner(createSigner);

export default {
  context,
  getAddress: resolver(context),
} satisfies CoinFrameworkSigner;
