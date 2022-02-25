import { WrongDeviceForAccount } from "@ledgerhq/errors";
import { Observable } from "rxjs";
import { close, open } from "../../hw";
import { Account, isSegwitDerivationMode } from "../../types";
import getAddress from "../../hw/getAddress";

export default function receive(
  account: Account,
  {
    deviceId,
  }: {
    deviceId: string;
  }
): Observable<{
  address: string;
  path: string;
}> {
  return new Observable((o) => {
    void (async function () {
      let transport;

      try {
        // TODO withDevice
        transport = await open(deviceId);

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
      } finally {
        if (transport != null) {
          await close(transport, deviceId);
        }
      }
    })();
  });
}
