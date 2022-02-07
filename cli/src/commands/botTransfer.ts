/* eslint-disable no-console */
import { from, of, throwError } from "rxjs";
import {
  catchError,
  filter,
  first,
  map,
  timeoutWith,
  tap,
} from "rxjs/operators";
import {
  listSupportedCurrencies,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/lib/currencies";
import {
  getAccountBridge,
  getCurrencyBridge,
} from "@ledgerhq/live-common/lib/bridge";
import { getEnv, setEnv } from "@ledgerhq/live-common/lib/env";
import { promiseAllBatched } from "@ledgerhq/live-common/lib/promise";
import { Account } from "@ledgerhq/live-common/lib/types";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/lib/bridge/cache";
import {
  autoSignTransaction,
  getImplicitDeviceAction,
} from "@ledgerhq/live-common/lib/bot/engine";
import {
  createImplicitSpeculos,
  releaseSpeculosDevice,
} from "@ledgerhq/live-common/lib/load/speculos";
import { formatOperation } from "@ledgerhq/live-common/lib/account";
import {
  calculate,
  inferTrackingPairForAccounts,
  initialState,
  loadCountervalues,
} from "@ledgerhq/live-common/lib/countervalues/logic";

const CONCURRENT = 3;

export default {
  description:
    "transfer funds from one seed (SEED) to another (SEED_RECIPIENT)",
  args: [],
  job: () => {
    const localCache = {};
    const cache = makeBridgeCacheSystem({
      saveData(c, d) {
        localCache[c.id] = d;
        return Promise.resolve();
      },
      getData(c) {
        return Promise.resolve(localCache[c.id]);
      },
    });

    async function getAllRecipients() {
      const prevSeed = getEnv("SEED");
      const { SEED_RECIPIENT } = process.env;
      setEnv("SEED", SEED_RECIPIENT);
      const recipientsPerCurrencyId: Map<string, string> = new Map();
      await promiseAllBatched(
        CONCURRENT,
        listSupportedCurrencies(),
        async (currency) => {
          let device;
          try {
            const r = await createImplicitSpeculos(
              `speculos:nanos:${currency.id}`
            );
            if (!r) return;
            device = r.device;
            await cache.prepareCurrency(currency);
            const maybeAddress = await getCurrencyBridge(currency)
              .scanAccounts({
                currency,
                deviceId: device.id,
                syncConfig: {
                  paginationConfig: {},
                },
              })
              .pipe(
                filter((e) => e.type === "discovered"),
                first(),
                timeoutWith(
                  120 * 1000,
                  throwError(new Error("scan account timeout"))
                ),
                map((e) => e.account.freshAddress),
                catchError((err) => {
                  console.error(
                    "couldn't infer address for a " + currency.id + " account",
                    err
                  );
                  return of(null);
                })
              )
              .toPromise();
            if (maybeAddress) {
              recipientsPerCurrencyId.set(currency.id, maybeAddress);
            }
          } catch (e) {
            console.error(
              "Something went wrong on sending on " + currency.id,
              e
            );
          } finally {
            if (device) releaseSpeculosDevice(device.id);
          }
        }
      );
      setEnv("SEED", prevSeed);
      return recipientsPerCurrencyId;
    }

    async function botPortfolio() {
      const accounts: Account[] = [];
      await promiseAllBatched(
        CONCURRENT,
        listSupportedCurrencies(),
        async (currency) => {
          let device;
          try {
            const r = await createImplicitSpeculos(
              `speculos:nanos:${currency.id}`
            );
            if (!r) return;
            device = r.device;
            await getCurrencyBridge(currency)
              .scanAccounts({
                currency,
                deviceId: r.device.id,
                syncConfig: {
                  paginationConfig: {},
                },
              })
              .pipe(
                timeoutWith(
                  200 * 1000,
                  throwError(new Error("scan account timeout"))
                ),
                catchError((e) => {
                  console.error("scan accounts failed for " + currency.id, e);
                  return from([]);
                }),
                tap((e) => {
                  if (e.type === "discovered") {
                    accounts.push(e.account);
                  }
                })
              )
              .toPromise();
          } catch (e) {
            console.error(
              "Something went wrong on portfolio of " + currency.id,
              e
            );
          } finally {
            if (device) releaseSpeculosDevice(device.id);
          }
        }
      );
      return accounts;
    }

    const cvUSDThreshold = 10;

    async function sendAllFunds(
      accounts: Account[],
      recipientsPerCurrencyId: Map<string, string>
    ) {
      const countervalue = getFiatCurrencyByTicker("USD");
      const countervaluesState = await loadCountervalues(initialState, {
        trackingPairs: inferTrackingPairForAccounts(accounts, countervalue),
        autofillGaps: true,
      });

      await promiseAllBatched(CONCURRENT, accounts, async (account) => {
        const { currency } = account;
        const cv = calculate(countervaluesState, {
          from: currency,
          to: countervalue,
          value: account.balance.toNumber(),
        });
        if (!cv || cv < cvUSDThreshold) {
          return;
        }

        const recipient = recipientsPerCurrencyId.get(currency.id);
        if (!recipient) {
          console.log("no recipient to empty account " + account.id);
          return;
        }
        const accountBridge = getAccountBridge(account);

        // TODO in case of cosmos & other funds that can be delegated, we need to also schedule these txs first..
        const plannedTransactions: any[] = [];

        // FIXME better value than this arbitrary one: calc countervalues
        account.subAccounts?.forEach((subAccount) => {
          const cv = calculate(countervaluesState, {
            from: account.currency,
            to: countervalue,
            value: subAccount.balance.toNumber(),
          });
          if (cv && cv > cvUSDThreshold) {
            plannedTransactions.push(
              accountBridge.updateTransaction(
                accountBridge.createTransaction(account),
                {
                  recipient,
                  useAllAmount: true,
                  subAccountId: subAccount.id,
                }
              )
            );
          }
        });

        plannedTransactions.push(
          accountBridge.updateTransaction(
            accountBridge.createTransaction(account),
            {
              recipient,
              useAllAmount: true,
            }
          )
        );

        let device;
        try {
          const r = await createImplicitSpeculos(
            `speculos:nanos:${currency.id}`
          );

          for (const tx of plannedTransactions) {
            const transaction = await accountBridge.prepareTransaction(
              account,
              tx
            );
            const status = await accountBridge.getTransactionStatus(
              account,
              transaction
            );

            if (Object.keys(status.errors).length !== 0) {
              continue;
            }

            if (!r) {
              console.warn(
                "couldn't create a speculos transport for " + currency.id
              );
              return;
            }
            device = r.device;

            const signedOperation = await accountBridge
              .signOperation({
                account,
                transaction,
                deviceId: device.id,
              })
              .pipe(
                autoSignTransaction({
                  transport: device.transport,
                  deviceAction: getImplicitDeviceAction(account.currency),
                  appCandidate: r.appCandidate,
                  account,
                  transaction,
                  status,
                }),
                first((e: any) => e.type === "signed"),
                map((e) => e.signedOperation)
              )
              .toPromise();

            const optimisticOperation = getEnv("DISABLE_TRANSACTION_BROADCAST")
              ? signedOperation.operation
              : await accountBridge.broadcast({
                  account,
                  signedOperation,
                });

            console.log(formatOperation(account)(optimisticOperation));
          }
        } catch (e) {
          console.error(
            "Something went wrong on sending on account " + account.id,
            e
          );
        } finally {
          if (device) releaseSpeculosDevice(device.id);
        }
      });
    }

    async function main() {
      const recipientsPerCurrencyId = await getAllRecipients();
      console.log(
        Array.from(recipientsPerCurrencyId.keys()).length +
          " RECIPIENTS FETCHED"
      );
      const accounts = await botPortfolio();
      console.log(`BOT PORTFOLIO FETCHED ${accounts.length} accounts`);
      await sendAllFunds(accounts, recipientsPerCurrencyId);
    }

    return from(main());
  },
};
