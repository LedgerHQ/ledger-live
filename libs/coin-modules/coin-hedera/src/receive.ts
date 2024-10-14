import { WrongDeviceForAccount } from "@ledgerhq/errors";
import { Observable } from "rxjs";
import { withDevice } from "../../hw/deviceAccess";
import { isSegwitDerivationMode } from "@ledgerhq/coin-framework/derivation";
import getAddress from "../../hw/getAddress";
import type { Account, AccountBridge, DerivationMode } from "@ledgerhq/types-live";
import { Transaction } from "./types";

export const receive: AccountBridge<Transaction>["receive"] = (account: Account, { deviceId }) =>
  withDevice(deviceId)(transport => {
    return new Observable(o => {
      void (async function () {
        try {
          const r = await getAddress(transport, {
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
  });

export default receive;
