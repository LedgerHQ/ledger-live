/* eslint-disable no-param-reassign */
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import bs58check from "ripple-bs58check";
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
  RecipientRequired,
} from "@ledgerhq/errors";
import type { Account, Operation, SignOperationEvent } from "../../../types";
import {
  getDerivationModesForCurrency,
  getDerivationScheme,
  runDerivationScheme,
  isIterableDerivationMode,
  derivationModeSupportsIndex,
} from "../../../derivation";
import { formatCurrencyUnit } from "../../../currencies";
import { patchOperationWithHash } from "../../../operation";
import { getMainAccount } from "../../../account";
import {
  getAccountPlaceholderName,
  getNewAccountPlaceholderName,
  emptyHistoryCache,
} from "../../../account";
import getAddress from "../../../hw/getAddress";
import { open, close } from "../../../hw";
import {
  parseAPIValue,
  parseAPICurrencyObject,
  formatAPICurrencyXRP,
} from "../../../api/Ripple";
import type { CurrencyBridge, AccountBridge } from "../../../types/bridge";
import signTransaction from "../../../hw/signTransaction";
import type { Transaction, NetworkInfo } from "../types";
import { makeAccountBridgeReceive, mergeOps } from "../../../bridge/jsHelpers";
import {
  preparePayment,
  submit,
  getAccountInfo,
  getServerInfo,
  getTransactions,
} from "../../../api/Ripple";

// true if the error should be forwarded and is not a "not found" case
const checkAccountNotFound = (e) => {
  return (
    !e.data || (e.message !== "actNotFound" && e.data.error !== "actNotFound")
  );
};

const receive = makeAccountBridgeReceive();

const getSequenceNumber = async (account) => {
  const lastOp = account.operations.find((op) => op.type === "OUT");

  if (lastOp && lastOp.transactionSequenceNumber) {
    return (
      lastOp.transactionSequenceNumber + account.pendingOperations.length + 1
    );
  }

  const info = await getAccountInfo(account.freshAddress);
  return info.sequence + account.pendingOperations.length;
};

const uint32maxPlus1 = new BigNumber(2).pow(32);

const validateTag = (tag) => {
  return (
    !tag.isNaN() &&
    tag.isFinite() &&
    tag.isInteger() &&
    tag.isPositive() &&
    tag.lt(uint32maxPlus1)
  );
};

const signOperation = ({
  account,
  transaction,
  deviceId,
}): Observable<SignOperationEvent> =>
  new Observable((o) => {
    delete cacheRecipientsNew[transaction.recipient];
    const { fee } = transaction;
    if (!fee) throw new FeeNotLoaded();

    async function main() {
      try {
        const amount = formatAPICurrencyXRP(transaction.amount);
        const tag = transaction.tag ? transaction.tag : undefined;
        const payment = {
          source: {
            address: account.freshAddress,
            amount,
          },
          destination: {
            address: transaction.recipient,
            minAmount: amount,
            tag,
          },
        };
        const instruction = {
          fee: formatAPICurrencyXRP(fee).value,
          maxLedgerVersionOffset: 12,
        };
        if (tag)
          invariant(
            validateTag(new BigNumber(tag)),
            `tag is set but is not in a valid format, should be between [0 - ${uint32maxPlus1
              .minus(1)
              .toString()}]`
          );
        const prepared = await preparePayment(
          account.freshAddress,
          payment,
          instruction
        );
        let signature;
        const transport = await open(deviceId);

        try {
          o.next({
            type: "device-signature-requested",
          });
          signature = await signTransaction(
            account.currency,
            transport,
            account.freshAddressPath,
            JSON.parse(prepared.txJSON)
          );
          o.next({
            type: "device-signature-granted",
          });
        } finally {
          close(transport, deviceId);
        }

        const hash = "";
        const operation: Operation = {
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
          transactionSequenceNumber: await getSequenceNumber(account),
          extra: {} as any,
        };

        if (transaction.tag) {
          operation.extra.tag = transaction.tag;
        }

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
            expirationDate: null,
          },
        });
      } catch (e: any) {
        if (e && e.name === "RippledError" && e.data.resultMessage) {
          throw new Error(e.data.resultMessage);
        }

        throw e;
      }
    }

    main().then(
      () => o.complete(),
      (e) => o.error(e)
    );
  });

const broadcast = async ({ signedOperation: { signature, operation } }) => {
  const submittedPayment = await submit(signature);

  if (
    submittedPayment.engine_result !== "tesSUCCESS" &&
    submittedPayment.engine_result !== "terQUEUED"
  ) {
    throw new Error(submittedPayment.engine_result_message);
  }

  const { hash } = submittedPayment.tx_json;
  return patchOperationWithHash(operation, hash);
};

function isRecipientValid(recipient) {
  try {
    bs58check.decode(recipient);
    return true;
  } catch (e) {
    return false;
  }
}

type Tx = {
  type: string;
  address: string;
  sequence: number;
  id: string;
  specification: {
    source: {
      address: string;
      maxAmount: {
        currency: string;
        value: string;
      };
    };
    destination: {
      address: string;
      amount: {
        currency: string;
        value: string;
      };
      tag?: string;
    };
    paths: string;
  };
  outcome: {
    result: string;
    fee: string;
    timestamp: string;
    deliveredAmount?: {
      currency: string;
      value: string;
      counterparty: string;
    };
    balanceChanges: Record<
      string,
      Array<{
        counterparty: string;
        currency: string;
        value: string;
      }>
    >;
    orderbookChanges: Record<
      string,
      Array<{
        direction: string;
        quantity: {
          currency: string;
          value: string;
        };
        totalPrice: {
          currency: string;
          counterparty: string;
          value: string;
        };
        makeExchangeRate: string;
        sequence: number;
        status: string;
      }>
    >;
    ledgerVersion: number;
    indexInLedger: number;
  };
};

const txToOperation =
  (account: Account) =>
  ({
    id,
    sequence,
    outcome: { fee, deliveredAmount, ledgerVersion, timestamp },
    specification: { source, destination },
  }: Tx): Operation | null | undefined => {
    const type = source.address === account.freshAddress ? "OUT" : "IN";
    let value = deliveredAmount
      ? parseAPICurrencyObject(deliveredAmount)
      : new BigNumber(0);
    const feeValue = parseAPIValue(fee);

    if (type === "OUT") {
      if (!Number.isNaN(feeValue)) {
        value = value.plus(feeValue);
      }
    }

    const op: Operation = {
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
      extra: {},
    };

    if (destination.tag) {
      op.extra.tag = destination.tag;
    }

    return op;
  };

const recipientIsNew = async (endpointConfig, recipient) => {
  if (!isRecipientValid(recipient)) return false;

  try {
    await getAccountInfo(recipient, endpointConfig);
    return false;
  } catch (e) {
    if (checkAccountNotFound(e)) {
      throw e;
    }

    return true;
  }
};

// FIXME this could be cleaner
const remapError = (error) => {
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
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts: ({ currency, deviceId }) =>
    new Observable((o) => {
      let finished = false;

      const unsubscribe = () => {
        finished = true;
      };

      async function main() {
        let transport;

        try {
          transport = await open(deviceId);
          const serverInfo = await getServerInfo();
          const ledgers = serverInfo.completeLedgers.split("-");
          const minLedgerVersion = Number(ledgers[0]);
          const maxLedgerVersion = Number(ledgers[1]);
          const derivationModes = getDerivationModesForCurrency(currency);

          for (const derivationMode of derivationModes) {
            const derivationScheme = getDerivationScheme({
              derivationMode,
              currency,
            });
            const stopAt = isIterableDerivationMode(derivationMode) ? 255 : 1;

            for (let index = 0; index < stopAt; index++) {
              if (!derivationModeSupportsIndex(derivationMode, index)) continue;
              const freshAddressPath = runDerivationScheme(
                derivationScheme,
                currency,
                {
                  account: index,
                }
              );
              const { address } = await getAddress(transport, {
                currency,
                path: freshAddressPath,
                derivationMode,
              });
              if (finished) return;
              const accountId = `ripplejs:2:${currency.id}:${address}:${derivationMode}`;
              let info;

              try {
                info = await getAccountInfo(address);
              } catch (e) {
                if (checkAccountNotFound(e)) {
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
                        derivationMode,
                      }),
                      starred: false,
                      used: false,
                      freshAddress,
                      freshAddressPath,
                      freshAddresses: [
                        {
                          address: freshAddress,
                          derivationPath: freshAddressPath,
                        },
                      ],
                      balance: new BigNumber(0),
                      spendableBalance: new BigNumber(0),
                      blockHeight: maxLedgerVersion,
                      index,
                      currency,
                      operationsCount: 0,
                      operations: [],
                      pendingOperations: [],
                      unit: currency.units[0],
                      // @ts-expect-error archived does not exists on type Account
                      archived: false,
                      lastSyncDate: new Date(),
                      creationDate: new Date(),
                      swapHistory: [],
                      balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
                    },
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
              const transactions = await getTransactions(address, {
                minLedgerVersion,
                maxLedgerVersion,
                types: ["payment"],
              });
              if (finished) return;
              const account: Account = {
                type: "Account",
                id: accountId,
                seedIdentifier: freshAddress,
                derivationMode,
                name: getAccountPlaceholderName({
                  currency,
                  index,
                  derivationMode,
                }),
                starred: false,
                used: true,
                freshAddress,
                freshAddressPath,
                freshAddresses: [
                  {
                    address: freshAddress,
                    derivationPath: freshAddressPath,
                  },
                ],
                balance,
                spendableBalance: balance,
                // TODO calc with base reserve
                blockHeight: maxLedgerVersion,
                index,
                currency,
                operationsCount: 0,
                operations: [],
                pendingOperations: [],
                unit: currency.units[0],
                lastSyncDate: new Date(),
                creationDate: new Date(),
                swapHistory: [],
                balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
              };
              account.operations = transactions
                .map(txToOperation(account))
                .filter(Boolean);
              account.operationsCount = account.operations.length;

              if (account.operations.length > 0) {
                account.creationDate =
                  account.operations[account.operations.length - 1].date;
              }

              o.next({
                type: "discovered",
                account,
              });
            }
          }

          o.complete();
        } catch (e) {
          o.error(e);
        } finally {
          if (transport) {
            await close(transport, deviceId);
          }
        }
      }

      main();
      return unsubscribe;
    }),
};

const sync = ({
  endpointConfig,
  freshAddress,
  blockHeight,
  operations,
}: any): Observable<(arg0: Account) => Account> =>
  new Observable((o) => {
    let finished = false;
    const currentOpsLength = operations ? operations.length : 0;

    const unsubscribe = () => {
      finished = true;
    };

    async function main() {
      try {
        if (finished) return;
        const serverInfo = await getServerInfo(endpointConfig);
        if (finished) return;
        const ledgers = serverInfo.completeLedgers.split("-");
        const minLedgerVersion = Number(ledgers[0]);
        const maxLedgerVersion = Number(ledgers[1]);
        let info;

        try {
          info = await getAccountInfo(freshAddress);
        } catch (e) {
          if (checkAccountNotFound(e)) {
            throw e;
          }
        }

        if (finished) return;

        if (!info) {
          // account does not exist, we have nothing to sync but to update the last sync date
          o.next((a) => ({ ...a, lastSyncDate: new Date() }));
          o.complete();
          return;
        }

        const balance = parseAPIValue(info.xrpBalance);
        invariant(
          !balance.isNaN() && balance.isFinite(),
          `Ripple: invalid balance=${balance.toString()} for address ${freshAddress}`
        );
        const transactions = await getTransactions(freshAddress, {
          minLedgerVersion: Math.max(
            currentOpsLength === 0 ? 0 : blockHeight, // if there is no ops, it might be after a clear and we prefer to pull from the oldest possible history
            minLedgerVersion
          ),
          maxLedgerVersion,
          types: ["payment"],
        });
        if (finished) return;
        o.next((a) => {
          const newOps = transactions.map(txToOperation(a));
          const operations = mergeOps(a.operations, newOps);
          const [last] = operations;
          const pendingOperations = a.pendingOperations.filter(
            (oo) =>
              !operations.some((op) => oo.hash === op.hash) &&
              last &&
              last.transactionSequenceNumber &&
              oo.transactionSequenceNumber &&
              oo.transactionSequenceNumber > last.transactionSequenceNumber
          );
          return {
            ...a,
            balance,
            spendableBalance: balance,
            // TODO use reserve
            operations,
            pendingOperations,
            blockHeight: maxLedgerVersion,
            lastSyncDate: new Date(),
          };
        });
        o.complete();
      } catch (e) {
        o.error(remapError(e));
      }
    }

    main();
    return unsubscribe;
  });

const createTransaction = (): Transaction => ({
  family: "ripple",
  amount: new BigNumber(0),
  recipient: "",
  fee: null,
  tag: undefined,
  networkInfo: null,
  feeCustomUnit: null,
});

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const prepareTransaction = async (a: Account, t: Transaction) => {
  let networkInfo: NetworkInfo | null | undefined = t.networkInfo;

  if (!networkInfo) {
    try {
      const info = await getServerInfo(a.endpointConfig);
      const serverFee = parseAPIValue(info.validatedLedger.baseFeeXRP);
      networkInfo = {
        family: "ripple",
        serverFee,
        baseReserve: new BigNumber(0), // NOT USED. will refactor later.
      };
    } catch (e) {
      throw remapError(e);
    }
  }

  const fee = t.fee || networkInfo.serverFee;

  if (t.networkInfo !== networkInfo || t.fee !== fee) {
    return { ...t, networkInfo, fee };
  }

  return t;
};

const getTransactionStatus = async (a, t) => {
  const errors: {
    fee?: Error;
    amount?: Error;
    recipient?: Error;
  } = {};
  const warnings: {
    feeTooHigh?: Error;
  } = {};
  const r = await getServerInfo(a.endpointConfig);
  const reserveBaseXRP = parseAPIValue(r.validatedLedger.reserveBaseXRP);
  const estimatedFees = new BigNumber(t.fee || 0);
  const totalSpent = new BigNumber(t.amount).plus(estimatedFees);
  const amount = new BigNumber(t.amount);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (!t.fee) {
    errors.fee = new FeeNotLoaded();
  } else if (t.fee.eq(0)) {
    errors.fee = new FeeRequired();
  } else if (totalSpent.gt(a.balance.minus(reserveBaseXRP))) {
    errors.amount = new NotEnoughSpendableBalance("", {
      minimumAmount: formatCurrencyUnit(a.currency.units[0], reserveBaseXRP, {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
    });
  } else if (
    t.recipient &&
    (await cachedRecipientIsNew(a.endpointConfig, t.recipient)) &&
    t.amount.lt(reserveBaseXRP)
  ) {
    const f = formatAPICurrencyXRP(reserveBaseXRP);
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: `${f.currency} ${new BigNumber(f.value).toFixed()}`,
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
        currencyName: a.currency.name,
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
    totalSpent,
  });
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const r = await getServerInfo(mainAccount.endpointConfig);
  const reserveBaseXRP = parseAPIValue(r.validatedLedger.reserveBaseXRP);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    ...transaction,
    recipient: transaction?.recipient || "rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3",
    // public testing seed abandonx11,about
    amount: new BigNumber(0),
  });
  const s = await getTransactionStatus(mainAccount, t);
  return BigNumber.max(
    0,
    account.balance.minus(reserveBaseXRP).minus(s.estimatedFees)
  );
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  sync,
  receive,
  signOperation,
  broadcast,
};
export default {
  currencyBridge,
  accountBridge,
};
