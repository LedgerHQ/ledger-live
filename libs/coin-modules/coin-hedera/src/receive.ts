import { WrongDeviceForAccount } from "@ledgerhq/errors";
import { Observable } from "rxjs";
import { isSegwitDerivationMode } from "@ledgerhq/coin-framework/derivation";
import resolver from "./hw-getAddress";
import type { Account, AccountBridge, DerivationMode } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import { HederaSigner } from "./signer";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";

export const receive =
(
  signerContext: SignerContext<HederaSigner>,
): AccountBridge<Transaction>["receive"] => 
  ({account, deviceId }) =>
    new Observable(o => {
      void (async function () {
        try {
          const getAddress = resolver(signerContext);
          
          const r = await getAddress(deviceId, {
            derivationMode: account.derivationMode as DerivationMode,
            currency: account.currency,
            path: account.freshAddressPath,
            segwit: isSegwitDerivationMode(account.derivationMode as DerivationMode),
          });

          if (r.publicKey !== account.seedIdentifier) {
            throw new WrongDeviceForAccount();
          }

          o.next({
            address: account.freshAddress,
            path: account.freshAddressPath,
            publicKey: r.publicKey,
          });

          o.complete();
        } catch (err) {
          o.error(err);
        }
      })();
    });
    
export default receive;
