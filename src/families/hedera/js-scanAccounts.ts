import { Observable } from "rxjs";
import {
  Account,
  CryptoCurrency,
  DerivationMode,
  DeviceId,
  ScanAccountEvent,
  SyncConfig,
} from "../../types";
import { open, close } from "../../hw";
import {
  getDerivationModesForCurrency,
  getDerivationScheme,
  runDerivationScheme,
} from "../../derivation";
import getAddress from "../../hw/getAddress";
import BigNumber from "bignumber.js";
import { getAccountPlaceholderName, emptyHistoryCache } from "../../account";
import { getAccountsForPublicKey } from "./api/mirror";

export default function scanAccounts({
  currency,
  deviceId,
  scheme,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  syncConfig,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  preferredNewAccountScheme,
}: {
  currency: CryptoCurrency;
  deviceId: DeviceId;
  scheme?: DerivationMode | null | undefined;
  syncConfig: SyncConfig;
  preferredNewAccountScheme?: DerivationMode;
}): Observable<ScanAccountEvent> {
  const derivationMode = scheme ?? getDerivationModesForCurrency(currency)[0];

  return new Observable((o) => {
    void (async function () {
      let transport;

      try {
        const derivationScheme = getDerivationScheme({
          derivationMode,
          currency,
        });

        const index = 0;
        let cnt = 0;

        const addressPath = runDerivationScheme(derivationScheme, currency, {
          account: index,
        });

        transport = await open(deviceId);

        // NOTE: asking for the address in hedera will return only the public key
        const res = await getAddress(transport, {
          currency,
          path: addressPath,
          derivationMode,
        });

        // use a mirror node to ask for any accounts that have
        // this public key registered
        const accounts = await getAccountsForPublicKey(res.publicKey);

        for (const account of accounts) {
          o.next({
            type: "discovered",
            account: {
              type: "Account",
              id: `js:2:${currency.id}:${account.accountId}:${derivationMode}`,
              seedIdentifier: res.publicKey,
              derivationMode,
              index,
              // NOTE: we send the publicKey through as the "address"
              //       this is the only way to pass several hard-coded "is this the right device" checks
              freshAddress: res.publicKey,
              freshAddressPath: addressPath,
              freshAddresses: [
                {
                  address: res.publicKey,
                  derivationPath: addressPath,
                },
              ],
              name: getAccountPlaceholderName({
                currency,
                index: cnt,
                derivationMode,
              }),
              starred: false,
              used: true,
              currency,
              balance: account.balance ?? new BigNumber(0),
              spendableBalance: account.balance ?? new BigNumber(0),
              operationsCount: 0,
              operations: [],
              swapHistory: [],
              pendingOperations: [],
              unit: currency.units[0],
              creationDate: new Date(),
              lastSyncDate: new Date(),
              blockHeight: 10,
              balanceHistoryCache: emptyHistoryCache,
              hederaResources: {
                accountId: account.accountId,
              },
            } as Account,
          });

          cnt += 1;
        }

        o.complete();
      } catch (err) {
        o.error(err);
      } finally {
        if (transport != null) {
          close(transport, deviceId);
        }
      }
    })();
  });
}
