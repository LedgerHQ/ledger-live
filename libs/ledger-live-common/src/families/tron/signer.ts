import tronGetAddress from "./getAddress";
import type { TronSignature, TronSigner } from "@ledgerhq/coin-tron/types/index";
import Trx from "@ledgerhq/hw-app-trx";
import Transport from "@ledgerhq/hw-transport";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { type CreateSigner, executeWithSigner } from "../../bridge/setup";

/**
 * The part of the framework's third `signTransaction` argument this signer reads: the token, supplied
 * by `families/tron/bridge/api.ts:getDeviceSignOptions`. The framework spreads its own facts
 * (`derivationMode`, recipient domain) into the same object; none of them concern app-tron.
 */
type TronDeviceSignOptions = {
  token?: { id: string; ledgerSignature?: string };
};

/**
 * coin-tron's `TronSigner` is the device contract (it mirrors `hw-app-trx`), while the generic coin
 * framework signs through `signTransaction(path, rawTxHex, options)` and calls `getAddress` with an
 * options object rather than a boolean. This signer satisfies both.
 *
 * `SignerContext<S>` erases the signer's shape at the framework's call sites, so a mismatch here is
 * not a type error — it is a runtime failure at signing time. Both adaptations are load-bearing:
 * without `signTransaction` every signature throws, and forwarding the options object straight into
 * `getAddress`'s `boolDisplay` sets P1=0x01, which makes the app ask the user to confirm their
 * address in the middle of signing.
 */
type TronFrameworkSigner = TronSigner & {
  signTransaction(
    path: string,
    rawTxHex: string,
    options?: TronDeviceSignOptions,
  ): Promise<TronSignature>;
};

export const createSigner: CreateSigner<TronFrameworkSigner> = (transport: Transport) => {
  const trx = new Trx(transport);

  const sign = (path: string, rawTxHex: string, tokenSignatures: string[]) =>
    trx.signTransaction(path, rawTxHex, tokenSignatures);

  return {
    getAddress: (path: string, boolDisplay?: boolean | { verify?: boolean }) =>
      trx.getAddress(path, typeof boolDisplay === "boolean" ? boolDisplay : !!boolDisplay?.verify),
    sign,
    signTransaction: (path, rawTxHex, options) => {
      // app-tron needs the token's CAL signature to clear-sign a TRC-10 token's name and decimals.
      // TRC-20 transfers are ordinary contract calls, which need no token signature.
      const token = options?.token;
      const tokenSignatures =
        token?.id.startsWith("tron/trc10/") && token.ledgerSignature ? [token.ledgerSignature] : [];
      return sign(path, rawTxHex, tokenSignatures);
    },
  };
};

const context = executeWithSigner(createSigner);

export default {
  context,
  getAddress: tronGetAddress(context),
} satisfies CoinFrameworkSigner<TronFrameworkSigner>;
