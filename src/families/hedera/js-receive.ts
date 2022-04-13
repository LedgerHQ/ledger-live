import { WrongDeviceForAccount } from "@ledgerhq/errors";
import { Observable } from "rxjs";
import { withDevice } from "../../hw/deviceAccess";
import { Account, isSegwitDerivationMode } from "../../types";
import getAddress from "../../hw/getAddress";

const receive = (
  account: Account,
  {
    deviceId,
  }: {
    deviceId: string;
  }
): Observable<{
  address: string;
  path: string;
}> =>
  withDevice(deviceId)((transport) => {
    return new Observable((o) => {
      void (async function () {
        try {
          const r = await getAddress(transport, {
            derivationMode: account.derivationMode,
            currency: account.currency,
            path: account.freshAddressPath,
            segwit: isSegwitDerivationMode(account.derivationMode),
          });

          if (r.publicKey !== account.seedIdentifier) {
            throw new WrongDeviceForAccount(
              `WrongDeviceForAccount ${account.name}`,
              {
                accountName: account.name,
              }
            );
          }

          o.next({
            address: account.freshAddress,
            path: account.freshAddressPath,
          });

          o.complete();
        } catch (err) {
          o.error(err);
        }
      })();
    });
  });

export default receive;
