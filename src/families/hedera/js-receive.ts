import { WrongDeviceForAccount } from "@ledgerhq/errors";
import { Observable } from "rxjs";
import { close, open } from "../../hw";
import { Account, isSegwitDerivationMode } from "../../types";
import getAddress from "../../hw/getAddress";

export default function receive(
  account: Account,
  {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    verify,
    deviceId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    subAccountId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    freshAddressIndex,
  }: {
    verify?: boolean;
    deviceId: string;
    subAccountId?: string;
    freshAddressIndex?: number;
  }
): Observable<{
  address: string;
  path: string;
}> {
  return new Observable((o) => {
    void async function () {
      let transport;

      try {
        transport = await open(deviceId);

        let r = await getAddress(transport, {
          derivationMode: account.derivationMode,
          currency: account.currency,
          path: account.freshAddressPath,
          segwit: isSegwitDerivationMode(account.derivationMode),
        });

        if (r.address !== account.freshAddress) {
          throw new WrongDeviceForAccount(
            `WrongDeviceForAccount ${account.name}`,
            {
              accountName: account.name,
            }
          );
        }

        o.next({ 
          address: account.hederaResources!.accountId.toString(), 
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
    }();
  });
}
