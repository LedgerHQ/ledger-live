/* eslint-disable no-param-reassign */
import {
  AmountRequired,
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NetworkDown,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughSpendableBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import bs58check from "ripple-bs58check";
import { Observable } from "rxjs";
import { getMainAccount } from "../../../account";
import getLedgerIndex, { getAccountInfo, getServerInfo, parseAPIValue, submit } from "../api";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { formatCurrencyUnit } from "../../../currencies";
import signTransaction from "../../../hw/signTransaction";
import { withDevice } from "../../../hw/deviceAccess";
import { patchOperationWithHash } from "../../../operation";
import type {
  Account,
  AccountBridge,
  CurrencyBridge,
  Operation,
  SignOperationEvent,
} from "@ledgerhq/types-live";

import { scanAccounts, sync } from "../js-synchronization";
import type { NetworkInfo, Transaction } from "../types";

export const NEW_ACCOUNT_ERROR_MESSAGE = "actNotFound";
const LEDGER_OFFSET = 20;

const receive = makeAccountBridgeReceive();

const uint32maxPlus1 = new BigNumber(2).pow(32);

const validateTag = tag => {
  return (
    !tag.isNaN() && tag.isFinite() && tag.isInteger() && tag.isPositive() && tag.lt(uint32maxPlus1)
  );
};

const getNextValidSequence = async (account: Account) => {
  const accInfo = await getAccountInfo(account.freshAddress, true);
  return accInfo.account_data.Sequence;
};

const signOperation = ({ account, transaction, deviceId }): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        delete cacheRecipientsNew[transaction.recipient];
        const { fee } = transaction;
        if (!fee) throw new FeeNotLoaded();

        async function main() {
          try {
            const tag = transaction.tag ? transaction.tag : undefined;
            const nextSequenceNumber = await getNextValidSequence(account);
            const payment = {
              TransactionType: "Payment",
              Account: account.freshAddress,
              Amount: transaction.amount.toString(),
              Destination: transaction.recipient,
              DestinationTag: tag,
              Fee: fee.toString(),
              Flags: 2147483648,
              Sequence: nextSequenceNumber,
              LastLedgerSequence: (await getLedgerIndex()) + LEDGER_OFFSET,
            };
            if (tag)
              invariant(
                validateTag(new BigNumber(tag)),
                `tag is set but is not in a valid format, should be between [0 - ${uint32maxPlus1
                  .minus(1)
                  .toString()}]`,
              );

            o.next({
              type: "device-signature-requested",
            });
            const signature = await signTransaction(
              account.currency,
              transport,
              account.freshAddressPath,
              payment,
            );
            o.next({
              type: "device-signature-granted",
            });

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
              transactionSequenceNumber: nextSequenceNumber,
              extra: {} as any,
            };

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
          e => o.error(e),
        );
      }),
  );

const broadcast = async ({ signedOperation: { signature, operation } }): Promise<Operation> => {
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

function isRecipientValid(recipient: string): boolean {
  try {
    bs58check.decode(recipient);
    return true;
  } catch (e) {
    return false;
  }
}

const recipientIsNew = async (recipient: string): Promise<boolean> => {
  if (!isRecipientValid(recipient)) return false;

  const info = await getAccountInfo(recipient);
  if (info.error === NEW_ACCOUNT_ERROR_MESSAGE) {
    return true;
  }
  return false;
};

// FIXME this could be cleaner
const remapError = error => {
  const msg = error.message;

  if (msg.includes("Unable to resolve host") || msg.includes("Network is down")) {
    return new NetworkDown();
  }

  return error;
};

const cacheRecipientsNew = {};

const cachedRecipientIsNew = (recipient: string) => {
  if (recipient in cacheRecipientsNew) return cacheRecipientsNew[recipient];
  cacheRecipientsNew[recipient] = recipientIsNew(recipient);
  return cacheRecipientsNew[recipient];
};

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};

const createTransaction = (): Transaction => ({
  family: "ripple",
  amount: new BigNumber(0),
  recipient: "",
  fee: null,
  tag: undefined,
  networkInfo: null,
  feeCustomUnit: null,
});

const updateTransaction = (t: Transaction, patch: Transaction): Transaction => ({ ...t, ...patch });

const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  let networkInfo: NetworkInfo | null | undefined = t.networkInfo;

  if (!networkInfo) {
    try {
      const info = await getServerInfo(a.endpointConfig);
      const serverFee = parseAPIValue(info.info.validated_ledger.base_fee_xrp.toString());
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

const getTransactionStatus = async (a: Account, t: Transaction) => {
  const errors: {
    fee?: Error;
    amount?: Error;
    recipient?: Error;
  } = {};
  const warnings: {
    feeTooHigh?: Error;
  } = {};
  const r = await getServerInfo(a.endpointConfig);
  const reserveBaseXRP = parseAPIValue(r.info.validated_ledger.reserve_base_xrp.toString());
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
    (await cachedRecipientIsNew(t.recipient)) &&
    t.amount.lt(reserveBaseXRP)
  ) {
    errors.amount = new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: formatCurrencyUnit(a.currency.units[0], reserveBaseXRP, {
        disableRounding: true,
        useGrouping: false,
        showCode: true,
      }),
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
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const r = await getServerInfo(mainAccount.endpointConfig);
  const reserveBaseXRP = parseAPIValue(r.info.validated_ledger.reserve_base_xrp.toString());
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    ...transaction,
    recipient: transaction?.recipient || "rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3",
    // public testing seed abandonx11,about
    amount: new BigNumber(0),
  });
  const s = await getTransactionStatus(mainAccount, t);
  return BigNumber.max(0, account.balance.minus(reserveBaseXRP).minus(s.estimatedFees));
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  sync: sync,
  receive,
  signOperation,
  broadcast,
};
export default {
  currencyBridge,
  accountBridge,
};
