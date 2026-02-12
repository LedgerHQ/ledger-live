import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import type { ConcordiumAccount, ConcordiumSigner, Transaction } from "../types";

/**
 * Custom receive implementation for Concordium
 */
export const buildReceive =
  (
    _signerContext: SignerContext<ConcordiumSigner>,
  ): AccountBridge<Transaction, ConcordiumAccount>["receive"] =>
  account => {
    return new Observable(o => {
      async function main() {
        o.next({
          address: account.freshAddress,
          path: account.freshAddressPath,
          publicKey: account.concordiumResources?.publicKey || "",
        });
      }

      main().then(
        () => o.complete(),
        error => o.error(error),
      );
    });
  };
