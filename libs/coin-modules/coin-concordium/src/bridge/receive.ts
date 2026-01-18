import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import type { ConcordiumAccount, ConcordiumSigner, Transaction } from "../types";

/**
 * Custom receive implementation for Concordium
 *
 * Uses verifyAddress with identity/credential parameters stored in concordiumResources
 * instead of BIP32 path-based address derivation.
 *
 * Concordium addresses are computed as SHA256(credId), where credId is derived from
 * identity parameters, not from BIP32 paths like other blockchains.
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
