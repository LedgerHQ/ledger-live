import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { KaspaSigner } from "../signer";
import { KaspaAccount, KaspaTransaction } from "../types/bridge";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<KaspaSigner>,
  ): AccountBridge<KaspaTransaction, KaspaAccount>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      let cancelled = false;

      async function main() {
        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        o.next({ type: "device-signature-requested" });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );

      return () => {
        cancelled = true;
      };
    });

export default buildSignOperation;
