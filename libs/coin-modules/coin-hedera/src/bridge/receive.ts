import { WrongDeviceForAccount } from "@ledgerhq/errors";
import { Observable } from "rxjs";
import { isSegwitDerivationMode } from "@ledgerhq/coin-framework/derivation";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { Account, AccountBridge, DerivationMode } from "@ledgerhq/types-live";
import { Transaction } from "../types";

/*  this is due to libs/coin-modules/coin-hedera/src/hw-getAddress.ts
    r.address is actually the public key, to check if we're on another device
    we resort to this check instead
    we rely on seedIdentifier being the public key for Hedera accounts
    TODO: document where the seedIdentifier for hedera is set
    looks like it's set to the publickey in makeScanAccount here: libs/coin-framework/src/bridge/jsHelpers.ts */

export const receive =
  (getAddress: GetAddressFn): AccountBridge<Transaction>["receive"] =>
  (account: Account, { deviceId }) =>
    new Observable(o => {
      void (async function () {
        try {
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
