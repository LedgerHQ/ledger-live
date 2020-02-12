// @flow
/* eslint-disable no-param-reassign */

import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { RippleAPI } from "ripple-lib";
import bs58check from "ripple-bs58check";
import { computeBinaryTransactionHash } from "ripple-hashes";
import throttle from "lodash/throttle";
import {
  AmountRequired,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughSpendableBalance,
  InvalidAddress,
  FeeNotLoaded,
  FeeTooHigh,
  NetworkDown,
  InvalidAddressBecauseDestinationIsAlsoSource,
  FeeRequired,
  RecipientRequired
} from "@ledgerhq/errors";
import type { Account, Operation } from "../../../types";
import {
  getDerivationModesForCurrency,
  getDerivationScheme,
  runDerivationScheme,
  isIterableDerivationMode,
  derivationModeSupportsIndex
} from "../../../derivation";
import {
  getAccountPlaceholderName,
  getNewAccountPlaceholderName
} from "../../../account";
import getAddress from "../../../hw/getAddress";
import { open } from "../../../hw";
import {
  apiForEndpointConfig,
  parseAPIValue,
  parseAPICurrencyObject,
  formatAPICurrencyXRP
} from "../../../api/Ripple";
import type { CurrencyBridge, AccountBridge } from "../../../types/bridge";
import signTransaction from "../../../hw/signTransaction";
import type { Transaction, NetworkInfo } from "../types";

const signOperation = ({ account, transaction, deviceId }) =>
  Observable.create(o => {
    delete cacheRecipientsNew[transaction.recipient];
    const api = apiForEndpointConfig(RippleAPI, account.endpointConfig);
    const { fee } = transaction;
    if (!fee) throw new FeeNotLoaded();

    async function main() {
      try {
        await api.connect();
        const amount = formatAPICurrencyXRP(transaction.amount);
        const payment = {
          source: {
            address: account.freshAddress,
            amount
          },
          destination: {
            address: transaction.recipient,
            minAmount: amount,
            tag: transaction.tag ? transaction.tag : undefined
          }
        };
        const instruction = {
          fee: formatAPICurrencyXRP(fee).value,
          maxLedgerVersionOffset: 12
        };

        const prepared = await api.preparePayment(
          account.freshAddress,
          payment,
          instruction
        );

        let signature;
        const transport = await open(deviceId);
        try {
          o.next({ type: "device-signature-requested" });
          signature = await signTransaction(
            account.currency,
            transport,
            account.freshAddressPath,
            JSON.parse(prepared.txJSON)
          );
          o.next({ type: "device-signature-granted" });
        } finally {
          transport.close();
        }

        const hash = computeBinaryTransactionHash(transaction);
        const operation = {
          id: `${account.id}-${hash}-OUT`,
          hash,
          accountId: account.id,
          type: "OUT",
          value: transaction.amount,
          fee,
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [transaction.recipient],
          date: new Date(),
          // we probably can't get it so it's a predictive value
          transactionSequenceNumber:
            (account.operations.length > 0
              ? account.operations[0].transactionSequenceNumber
              : 0) + account.pendingOperations.length,
          extra: {}
        };

        if (transaction.tag) {
          operation.extra.tag = transaction.tag;
        }

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
            expirationDate: null
          }
        });
      } catch (e) {
        if (e && e.name === "RippledError" && e.data.resultMessage) {
          throw new Error(e.data.resultMessage);
        }
        throw e;
      } finally {
        api.disconnect();
      }
    }

    main().then(
      () => o.complete(),
      e => o.error(e)
    );
  });

const broadcast = async ({ signedOperation: { signature, operation } }) => {
  const api = apiForEndpointConfig(RippleAPI);
  try {
    await api.connect();
    const submittedPayment = await api.submit(signature);

    if (submittedPayment.resultCode !== "tesSUCCESS") {
      throw new Error(submittedPayment.resultMessage);
    }

    return operation;
  } finally {
    api.disconnect();
  }
};

function isRecipientValid(recipient) {
  try {
    bs58check.decode(recipient);
    return true;
  } catch (e) {
    return false;
  }
}

function mergeOps(existing: Operation[], newFetched: Operation[]) {
  const ids = existing.map(o => o.id);
  const all = existing.concat(newFetched.filter(o => !ids.includes(o.id)));
  return all.sort((a, b) => b.date - a.date);
}

type Tx = {
  type: string,
  address: string,
  sequence: number,
  id: string,
  specification: {
    source: {
      address: string,
      maxAmount: {
        currency: string,
        value: string
      }
    },
    destination: {
      address: string,
      amount: {
        currency: string,
        value: string
      },
      tag?: string
    },
    paths: string
  },
  outcome: {
    result: string,
    fee: string,
    timestamp: string,
    deliveredAmount?: {
      currency: string,
      value: string,
      counterparty: string
    },
    balanceChanges: {
      [addr: string]: Array<{
        counterparty: string,
        currency: string,
        value: string
      }>
    },
    orderbookChanges: {
      [addr: string]: Array<{
        direction: string,
        quantity: {
          currency: string,
          value: string
        },
        totalPrice: {
          currency: string,
          counterparty: string,
          value: string
        },
        makeExchangeRate: string,
        sequence: number,
        status: string
      }>
    },
    ledgerVersion: number,
    indexInLedger: number
  }
};

const txToOperation = (account: Account) => ({
  id,
  sequence,
  outcome: { fee, deliveredAmount, ledgerVersion, timestamp },
  specification: { source, destination }
}: Tx): ?Operation => {
  const type = source.address === account.freshAddress ? "OUT" : "IN";
  let value = deliveredAmount
    ? parseAPICurrencyObject(deliveredAmount)
    : BigNumber(0);
  const feeValue = parseAPIValue(fee);
  if (type === "OUT") {
    if (!Number.isNaN(feeValue)) {
      value = value.plus(feeValue);
    }
  }

  const op: $Exact<Operation> = {
    id: `${account.id}-${id}-${type}`,
    hash: id,
    accountId: account.id,
    type,
    value,
    fee: feeValue,
    blockHash: null,
    blockHeight: ledgerVersion,
    senders: [source.address],
    recipients: [destination.address],
    date: new Date(timestamp),
    transactionSequenceNumber: sequence,
    extra: {}
  };
  if (destination.tag) {
    op.extra.tag = destination.tag;
  }
  return op;
};

const getServerInfo = (map => endpointConfig => {
  if (!endpointConfig) endpointConfig = "";
  if (map[endpointConfig]) return map[endpointConfig]();
  const f = throttle(async () => {
    const api = apiForEndpointConfig(RippleAPI, endpointConfig);
    try {
      await api.connect();
      const res = await api.getServerInfo();
      return res;
    } catch (e) {
      f.cancel();
      throw e;
    } finally {
      api.disconnect();
    }
  }, 60000);
  map[endpointConfig] = f;
  return f();
})({});

const recipientIsNew = async (endpointConfig, recipient) => {
  if (!isRecipientValid(recipient)) return false;
  const api = apiForEndpointConfig(RippleAPI, endpointConfig);
  try {
    await api.connect();
    try {
      await api.getAccountInfo(recipient);
      return false;
    } catch (e) {
      if (e.message !== "actNotFound") {
        throw e;
      }
      return true;
    }
  } finally {
    api.disconnect();
  }
};

// FIXME this could be cleaner
const remapError = error => {
  const msg = error.message;

  if (
    msg.includes("Unable to resolve host") ||
    msg.includes("Network is down")
  ) {
    return new NetworkDown();
  }

  return error;
};

const cacheRecipientsNew = {};
const cachedRecipientIsNew = (endpointConfig, recipient) => {
  if (recipient in cacheRecipientsNew) return cacheRecipientsNew[recipient];
  cacheRecipientsNew[recipient] = recipientIsNew(endpointConfig, recipient);
  return cacheRecipientsNew[recipient];
};

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve(),
  hydrate: () => {},
  scanAccounts: ({ currency, deviceId }) =>
    Observable.create(o => {
      let finished = false;
      const unsubscribe = () => {
        finished = true;
      };

      async function main() {
        const api = apiForEndpointConfig(RippleAPI);
        let transport;
        try {
          transport = await open(deviceId);
          await api.connect();
          const serverInfo = await getServerInfo();
          const ledgers = serverInfo.completeLedgers.split("-");
          const minLedgerVersion = Number(ledgers[0]);
          const maxLedgerVersion = Number(ledgers[1]);

          const derivationModes = getDerivationModesForCurrency(currency);
          for (const derivationMode of derivationModes) {
            const derivationScheme = getDerivationScheme({
              derivationMode,
              currency
            });
            const stopAt = isIterableDerivationMode(derivationMode) ? 255 : 1;
            for (let index = 0; index < stopAt; index++) {
              if (!derivationModeSupportsIndex(derivationMode, index)) continue;
              const freshAddressPath = runDerivationScheme(
                derivationScheme,
                currency,
                {
                  account: index
                }
              );

              const { address } = await getAddress(transport, {
                currency,
                path: freshAddressPath,
                derivationMode
              });

              if (finished) return;

              const accountId = `ripplejs:2:${currency.id}:${address}:${derivationMode}`;

              let info;
              try {
                info = await api.getAccountInfo(address);
              } catch (e) {
                if (e.message !== "actNotFound") {
                  throw e;
                }
              }

              // fresh address is address. ripple never changes.
              const freshAddress = address;

              if (!info) {
                // account does not exist in Ripple server
                // we are generating a new account locally
                if (derivationMode === "") {
                  o.next({
                    type: "discovered",
                    account: {
                      type: "Account",
                      id: accountId,
                      seedIdentifier: freshAddress,
                      derivationMode,
                      name: getNewAccountPlaceholderName({
                        currency,
                        index,
                        derivationMode
                      }),
                      starred: false,
                      freshAddress,
                      freshAddressPath,
                      freshAddresses: [
                        {
                          address: freshAddress,
                          derivationPath: freshAddressPath
                        }
                      ],
                      balance: BigNumber(0),
                      spendableBalance: BigNumber(0),
                      blockHeight: maxLedgerVersion,
                      index,
                      currency,
                      operationsCount: 0,
                      operations: [],
                      pendingOperations: [],
                      unit: currency.units[0],
                      archived: false,
                      lastSyncDate: new Date()
                    }
                  });
                }
                break;
              }

              if (finished) return;
              const balance = parseAPIValue(info.xrpBalance);
              invariant(
                !balance.isNaN() && balance.isFinite(),
                `Ripple: invalid balance=${balance.toString()} for address ${address}`
              );

              const transactions = await api.getTransactions(address, {
                minLedgerVersion,
                maxLedgerVersion,
                types: ["payment"]
              });
              if (finished) return;

              const account: $Exact<Account> = {
                type: "Account",
                id: accountId,
                seedIdentifier: freshAddress,
                derivationMode,
                name: getAccountPlaceholderName({
                  currency,
                  index,
                  derivationMode
                }),
                starred: false,
                freshAddress,
                freshAddressPath,
                freshAddresses: [
                  {
                    address: freshAddress,
                    derivationPath: freshAddressPath
                  }
                ],
                balance,
                spendableBalance: balance, // TODO calc with base reserve
                blockHeight: maxLedgerVersion,
                index,
                currency,
                operationsCount: 0,
                operations: [],
                pendingOperations: [],
                unit: currency.units[0],
                lastSyncDate: new Date()
              };
              account.operations = transactions
                .map(txToOperation(account))
                .filter(Boolean);
              account.operationsCount = account.operations.length;
              o.next({ type: "discovered", account });
            }
          }
          o.complete();
        } catch (e) {
          o.error(e);
        } finally {
          api.disconnect();
          if (transport) {
            await transport.close();
          }
        }
      }

      main();

      return unsubscribe;
    })
};

const sync = ({
  endpointConfig,
  freshAddress,
  blockHeight,
  operations: { length: currentOpsLength }
}) =>
  Observable.create(o => {
    let finished = false;
    const unsubscribe = () => {
      finished = true;
    };

    async function main() {
      const api = apiForEndpointConfig(RippleAPI, endpointConfig);
      try {
        await api.connect();
        if (finished) return;
        const serverInfo = await getServerInfo(endpointConfig);
        if (finished) return;
        const ledgers = serverInfo.completeLedgers.split("-");
        const minLedgerVersion = Number(ledgers[0]);
        const maxLedgerVersion = Number(ledgers[1]);

        let info;
        try {
          info = await api.getAccountInfo(freshAddress);
        } catch (e) {
          if (e.message !== "actNotFound") {
            throw e;
          }
        }
        if (finished) return;

        if (!info) {
          // account does not exist, we have nothing to sync but to update the last sync date
          o.next(a => ({
            ...a,
            lastSyncDate: new Date()
          }));
          o.complete();
          return;
        }

        const balance = parseAPIValue(info.xrpBalance);
        invariant(
          !balance.isNaN() && balance.isFinite(),
          `Ripple: invalid balance=${balance.toString()} for address ${freshAddress}`
        );

        const transactions = await api.getTransactions(freshAddress, {
          minLedgerVersion: Math.max(
            currentOpsLength === 0 ? 0 : blockHeight, // if there is no ops, it might be after a clear and we prefer to pull from the oldest possible history
            minLedgerVersion
          ),
          maxLedgerVersion,
          types: ["payment"]
        });

        if (finished) return;

        o.next(a => {
          const newOps = transactions.map(txToOperation(a));
          const operations = mergeOps(a.operations, newOps);
          const [last] = operations;
          const pendingOperations = a.pendingOperations.filter(
            oo =>
              !operations.some(op => oo.hash === op.hash) &&
              last &&
              last.transactionSequenceNumber &&
              oo.transactionSequenceNumber &&
              oo.transactionSequenceNumber > last.transactionSequenceNumber
          );
          return {
            ...a,
            balance,
            spendableBalance: balance, // TODO use reserve
            operations,
            pendingOperations,
            blockHeight: maxLedgerVersion,
            lastSyncDate: new Date()
          };
        });

        o.complete();
      } catch (e) {
        o.error(remapError(e));
      } finally {
        api.disconnect();
      }
    }

    main();

    return unsubscribe;
  });

const createTransaction = () => ({
  family: "ripple",
  amount: BigNumber(0),
  recipient: "",
  fee: null,
  tag: undefined,
  networkInfo: null,
  feeCustomUnit: null
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const prepareTransaction = async (a: Account, t: Transaction) => {
  let networkInfo: ?NetworkInfo = t.networkInfo;
  if (!networkInfo) {
    const api = apiForEndpointConfig(RippleAPI, a.endpointConfig);
    try {
      await api.connect();
      const info = await api.getServerInfo();
      const serverFee = parseAPIValue(info.validatedLedger.baseFeeXRP);
      networkInfo = {
        family: "ripple",
        serverFee,
        baseReserve: BigNumber(0) // NOT USED. will refactor later.
      };
    } catch (e) {
      throw remapError(e);
    } finally {
      api.disconnect();
    }
  }

  const fee = t.fee || networkInfo.serverFee;

  if (t.networkInfo !== networkInfo || t.fee !== fee) {
    return {
      ...t,
      networkInfo,
      fee
    };
  }

  return t;
};

const getTransactionStatus = async (a, t) => {
  const errors = {};
  const warnings = {};
  const r = await getServerInfo(a.endpointConfig);
  const reserveBaseXRP = parseAPIValue(r.validatedLedger.reserveBaseXRP);

  const estimatedFees = BigNumber(t.fee || 0);

  const totalSpent = BigNumber(t.amount).plus(estimatedFees);

  const amount = BigNumber(t.amount);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (!t.fee) {
    errors.fee = new FeeNotLoaded();
  } else if (t.fee.eq(0)) {
    errors.fee = new FeeRequired();
  } else if (totalSpent.gt(a.balance.minus(reserveBaseXRP))) {
    errors.amount = new NotEnoughSpendableBalance();
  } else if (
    t.recipient &&
    (await cachedRecipientIsNew(a.endpointConfig, t.recipient)) &&
    t.amount.lt(reserveBaseXRP)
  ) {
    const f = formatAPICurrencyXRP(reserveBaseXRP);
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: `${f.currency} ${BigNumber(f.value).toFixed()}`
    });
  }

  if (!t.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (a.freshAddress === t.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else {
    try {
      bs58check.decode(t.recipient);
    } catch (e) {
      errors.recipient = new InvalidAddress("", {
        currencyName: a.currency.name
      });
    }
  }

  if (!errors.amount && amount.eq(0)) {
    errors.amount = new AmountRequired();
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent
  });
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  sync,
  signOperation,
  broadcast
};

export default { currencyBridge, accountBridge };
