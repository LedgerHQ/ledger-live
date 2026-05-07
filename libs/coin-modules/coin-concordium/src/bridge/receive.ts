import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import coinConfig from "../config";
import type { ConcordiumAccount, ConcordiumSigner, Transaction } from "../types";

/**
 * Custom receive implementation for Concordium.
 *
 * When `verify` is true, invokes on-device address verification via the
 * trusted backend pattern. Errors from the device or the trusted metadata
 * service propagate through the observable so the UI can react.
 */
export const buildReceive =
  (
    signerContext: SignerContext<ConcordiumSigner>,
  ): AccountBridge<Transaction, ConcordiumAccount>["receive"] =>
  (account, { deviceId, verify }) => {
    return new Observable(o => {
      async function main() {
        if (verify) {
          const network = coinConfig.getCoinConfig(account.currency.id).networkType;
          await signerContext(deviceId, signer =>
            signer.verifyAddress(account.freshAddressPath, account.freshAddress, network),
          );
        }

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
