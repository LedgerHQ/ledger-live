import Near from "@ledgerhq/hw-app-near";
import Transport from "@ledgerhq/hw-transport";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { executeWithSigner } from "../../bridge/setup";

const createSigner = (transport: Transport) => {
  const near = new Near(transport);
  return {
    // Framework calls signer.getAddress(path, { derivationMode, ... }); resolver calls (path, boolean).
    // Accept both by normalising the second arg.
    getAddress: async (path: string, options?: boolean | { verify?: boolean }) => {
      const verify = typeof options === "boolean" ? options : (options?.verify ?? false);
      return near.getAddress(path, verify);
    },

    // Framework calls signTransaction(path, base64Tx, opts) — path first, base64 tx second.
    signTransaction: async (path: string, base64Tx: string): Promise<string> => {
      // craftTransaction returns base64 — decode before device call.
      // Without this: UNKNOWN_ERROR (0xb005) on 2nd APDU chunk.
      const decoded = Buffer.from(base64Tx, "base64");
      const sig = await near.signTransaction(decoded, path);
      if (!sig) throw new Error("Near: no signature returned from device");
      // hw-app-near returns raw Buffer — combine()'s decodeSignature() expects hex string.
      // Without this: "Near: signature is not valid hex".
      return sig.toString("hex");
    },
  };
};

const context = executeWithSigner(createSigner);

// Inline GetAddressFn to avoid SignerContext<frameworkSigner> vs SignerContext<NearSigner> cast.
const getAddress: GetAddressFn = (deviceId, { path, verify }) =>
  context(deviceId, signer =>
    signer
      .getAddress(path, verify || false)
      .then(r => ({ address: r.address, publicKey: r.publicKey, path })),
  );

export default {
  context,
  getAddress,
} satisfies CoinFrameworkSigner;
