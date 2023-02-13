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
} from "@ledgerhq/live-common/currencies/index";
import {
  getAccountBridge,
  getCurrencyBridge,
} from "@ledgerhq/live-common/bridge/index";
import { getEnv, setEnv } from "@ledgerhq/live-common/env";
import { promiseAllBatched } from "@ledgerhq/live-common/promise";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/bridge/cache";
import { autoSignTransaction } from "@ledgerhq/live-common/bot/engine";
import allSpecs from "@ledgerhq/live-common/generated/specs";
import {
  createImplicitSpeculos,
  releaseSpeculosDevice,
} from "@ledgerhq/live-common/load/speculos";
import { formatOperation } from "@ledgerhq/live-common/account/index";
import {
  calculate,
  inferTrackingPairForAccounts,
  initialState,
  loadCountervalues,
} from "@ledgerhq/live-common/countervalues/logic";
import { Account, TransactionCommon } from "@ledgerhq/types-live";
import { AppSpec } from "@ledgerhq/live-common/lib/bot/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const CONCURRENT = parseInt(process.env.CONCURRENCY || "2", 10);
const ONLY_CURRENCIES = process.env.ONLY_CURRENCIES
  ? process.env.ONLY_CURRENCIES.split(",")
      .map((c) => c.trim())
      .filter(Boolean)
  : null;

// TODO improve botTransfer by only using "allSpecs" and introduce a "transferMutation" in the specs for all spec to define how to transfer funds out (as well as UNDELEGATING funds)

function getImplicitDeviceAction(currency, forSubAccount) {
  for (const k in allSpecs) {
    const familySpec = allSpecs[k];
    for (const c in familySpec) {
      const spec: AppSpec<any> = familySpec[c];
      if (spec.currency === currency) {
        if (forSubAccount && spec.genericDeviceActionForSubAccountTransfers) {
          return spec.genericDeviceActionForSubAccountTransfers;
        }
        return spec.genericDeviceAction;
      }
    }
  }
}

const split = process.env.FUNDS_SPLIT && parseInt(process.env.FUNDS_SPLIT, 10);

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

    async function getAllRecipients(currencies: CryptoCurrency[]) {
      const prevSeed = getEnv("SEED");
      const { SEED_RECIPIENT } = process.env;
      setEnv("SEED", SEED_RECIPIENT);
      const recipientsPerCurrencyId: Map<string, string> = new Map();
      await promiseAllBatched(CONCURRENT, currencies, async (currency) => {
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
                getEnv("BOT_TIMEOUT_SCAN_ACCOUNTS"),
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
          console.error("Something went wrong on sending on " + currency.id, e);
        } finally {
          if (device) releaseSpeculosDevice(device.id);
        }
      });
      setEnv("SEED", prevSeed);
      return recipientsPerCurrencyId;
    }

    async function botPortfolio(currencies: CryptoCurrency[]) {
      const accounts: Account[] = [];
      await promiseAllBatched(CONCURRENT, currencies, async (currency) => {
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
                getEnv("BOT_TIMEOUT_SCAN_ACCOUNTS"),
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
      });
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
        const plannedTransactions: TransactionCommon[] = [];

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
                  ...(split && split > 1
                    ? {
                        amount: subAccount.balance.div(split).integerValue(),
                      }
                    : { useAllAmount: true }),
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
              ...(split && split > 1
                ? { amount: account.spendableBalance.div(split).integerValue() }
                : { useAllAmount: true }),
            }
          )
        );

        let device;
        try {
          const r = await createImplicitSpeculos(
            `speculos:nanos:${currency.id}`
          );
          if (!r) {
            console.warn(
              "couldn't create a speculos transport for " + currency.id
            );
            return;
          }
          device = r.device;

          for (const tx of plannedTransactions) {
            try {
              const deviceAction = getImplicitDeviceAction(
                account.currency,
                "subAccountId" in tx
              );
              if (!deviceAction) {
                throw new Error(
                  "no spec found for currency " + account.currency.id
                );
              }

              const transaction = await accountBridge.prepareTransaction(
                account,
                tx
              );
              const statusCommon = await accountBridge.getTransactionStatus(
                account,
                transaction
              );

              if (Object.keys(statusCommon.errors).length !== 0) {
                continue;
              }

              const status = { ...statusCommon, family: transaction.family };

              const signedOperation = await accountBridge
                .signOperation({
                  account,
                  transaction,
                  deviceId: device.id,
                })
                .pipe(
                  autoSignTransaction({
                    transport: device.transport,
                    deviceAction,
                    appCandidate: r.appCandidate,
                    account,
                    transaction,
                    status,
                    disableStrictStepValueValidation: true, // we transfer the funds without validating the field values
                  }),
                  first((e: any) => e.type === "signed"),
                  map((e) => e.signedOperation)
                )
                .toPromise();

              const optimisticOperation = getEnv(
                "DISABLE_TRANSACTION_BROADCAST"
              )
                ? signedOperation.operation
                : await accountBridge.broadcast({
                    account,
                    signedOperation,
                  });

              console.log(formatOperation(account)(optimisticOperation));
            } catch (e) {
              console.error(
                "Something went wrong on trying to send from " + account.id,
                tx,
                e
              );
            }
          }
        } catch (e) {
          console.error("Something went wrong on account " + account.id, e);
        } finally {
          if (device) releaseSpeculosDevice(device.id);
        }
      });
    }

    async function main() {
      let currencies = listSupportedCurrencies();
      if (ONLY_CURRENCIES) {
        currencies = currencies.filter((c) => ONLY_CURRENCIES.includes(c.id));
      }
      currencies.sort(() => Math.random() - 0.5);
      const recipientsPerCurrencyId = await getAllRecipients(currencies);
      console.log(
        Array.from(recipientsPerCurrencyId.keys()).length +
          " RECIPIENTS FETCHED"
      );
      const accounts = await botPortfolio(currencies);
      console.log(`BOT PORTFOLIO FETCHED ${accounts.length} accounts`);
      await sendAllFunds(accounts, recipientsPerCurrencyId);
    }

    return from(main());
  },
};
