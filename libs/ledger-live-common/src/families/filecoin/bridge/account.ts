import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import Fil from "@zondax/ledger-filecoin";
import { Observable } from "rxjs";

import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import {
  Account,
  AccountBridge,
  AccountLike,
  BroadcastFnSignature,
  Operation,
  SignOperationEvent,
  SignOperationFnSignature,
} from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "../types";
import { getAccountShape, getAddress, getTxToBroadcast } from "./utils/utils";
import { broadcastTx, fetchBalances, fetchEstimatedFees } from "./utils/api";
import { getMainAccount } from "../../../account";
import { close } from "../../../hw";
import { toCBOR } from "./utils/serializer";
import { calculateEstimatedFees, getPath, isError } from "../utils";
import { log } from "@ledgerhq/logs";
import { getAddressRaw, validateAddress } from "./utils/addresses";
import { encodeOperationId, patchOperationWithHash } from "../../../operation";
import { withDevice } from "../../../hw/deviceAccess";

const receive = makeAccountBridgeReceive();

const createTransaction = (): Transaction => {
  // log("debug", "[createTransaction] creating base tx");

  return {
    family: "filecoin",
    amount: new BigNumber(0),
    method: 0,
    version: 0,
    nonce: 0,
    gasLimit: new BigNumber(0),
    gasFeeCap: new BigNumber(0),
    gasPremium: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
  };
};

const updateTransaction = (t: Transaction, patch: Transaction): Transaction => {
  // log("debug", "[updateTransaction] patching tx");

  return { ...t, ...patch };
};

const getTransactionStatus = async (
  a: Account,
  t: Transaction
): Promise<TransactionStatus> => {
  // log("debug", "[getTransactionStatus] start fn");

  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance } = a;
  const { address } = getAddress(a);
  const { recipient, useAllAmount, gasPremium, gasFeeCap, gasLimit } = t;
  let { amount } = t;

  if (!recipient) errors.recipient = new RecipientRequired();
  else if (!validateAddress(recipient).isValid)
    errors.recipient = new InvalidAddress();
  else if (!validateAddress(address).isValid)
    errors.sender = new InvalidAddress();

  if (gasFeeCap.eq(0) || gasPremium.eq(0) || gasLimit.eq(0))
    errors.gas = new FeeNotLoaded();

  // This is the worst case scenario (the tx won't cost more than this value)
  const estimatedFees = calculateEstimatedFees(gasFeeCap, gasLimit);

  let totalSpent;
  if (useAllAmount) {
    totalSpent = a.spendableBalance;
    amount = totalSpent.minus(estimatedFees);
    if (amount.lte(0) || totalSpent.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    totalSpent = amount.plus(estimatedFees);
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    } else if (totalSpent.gt(a.spendableBalance))
      errors.amount = new NotEnoughBalance();
  }

  // log("debug", "[getTransactionStatus] finish fn");

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  // log("debug", "[estimateMaxSpendable] start fn");

  const a = getMainAccount(account, parentAccount);
  const { address } = getAddress(a);

  const recipient = transaction?.recipient;

  if (!validateAddress(address).isValid) throw new InvalidAddress();
  if (recipient && !validateAddress(recipient).isValid)
    throw new InvalidAddress();

  const balances = await fetchBalances(address);
  const balance = new BigNumber(balances.spendable_balance);

  if (balance.eq(0)) return balance;

  const amount = transaction?.amount;

  const result = await fetchEstimatedFees({ to: recipient, from: address });
  const gasFeeCap = new BigNumber(result.gas_fee_cap);
  const gasLimit = new BigNumber(result.gas_limit);
  const estimatedFees = calculateEstimatedFees(gasFeeCap, gasLimit);

  if (balance.lte(estimatedFees)) return new BigNumber(0);

  balance.minus(estimatedFees);
  if (amount) balance.minus(amount);

  // log("debug", "[estimateMaxSpendable] finish fn");

  return balance;
};

const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => {
  // log("debug", "[prepareTransaction] start fn");

  const { address } = getAddress(a);
  const { recipient } = t;

  if (recipient && address) {
    // log("debug", "[prepareTransaction] fetching estimated fees");

    if (
      validateAddress(recipient).isValid &&
      validateAddress(address).isValid
    ) {
      const result = await fetchEstimatedFees({ to: recipient, from: address });
      t.gasFeeCap = new BigNumber(result.gas_fee_cap);
      t.gasPremium = new BigNumber(result.gas_premium);
      t.gasLimit = new BigNumber(result.gas_limit);
      t.nonce = result.nonce;
    }
  }

  // log("debug", "[prepareTransaction] finish fn");

  return t;
};

const sync = makeSync({ getAccountShape });

const broadcast: BroadcastFnSignature = async ({
  signedOperation: { operation, signature },
}) => {
  // log("debug", "[broadcast] start fn");

  const tx = getTxToBroadcast(operation, signature);

  const resp = await broadcastTx(tx);
  const { hash } = resp;

  const result = patchOperationWithHash(operation, hash);

  // log("debug", "[broadcast] finish fn");

  return result;
};

const signOperation: SignOperationFnSignature<Transaction> = ({
  account,
  deviceId,
  transaction,
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    (transport) =>
      new Observable((o) => {
        async function main() {
          // log("debug", "[signOperation] start fn");

          const {
            recipient,
            method,
            version,
            nonce,
            gasFeeCap,
            gasLimit,
            gasPremium,
            useAllAmount,
          } = transaction;
          let { amount } = transaction;
          const { id: accountId, balance } = account;
          const { address, derivationPath } = getAddress(account);

          if (!gasFeeCap.gt(0) || !gasLimit.gt(0)) {
            log(
              "debug",
              `signOperation missingData --> gasFeeCap=${gasFeeCap} gasLimit=${gasLimit}`
            );
            throw new FeeNotLoaded();
          }

          const filecoin = new Fil(transport);

          try {
            o.next({
              type: "device-signature-requested",
            });

            const fee = calculateEstimatedFees(gasFeeCap, gasLimit);
            if (useAllAmount) amount = balance.minus(fee);

            transaction = { ...transaction, amount };

            // Serialize tx
            const serializedTx = toCBOR(
              getAddressRaw(address),
              getAddressRaw(recipient),
              transaction
            );

            log(
              "debug",
              `[signOperation] serialized CBOR tx: [${serializedTx.toString(
                "hex"
              )}]`
            );

            // Sign by device
            const result = await filecoin.sign(
              getPath(derivationPath),
              serializedTx
            );
            isError(result);

            o.next({
              type: "device-signature-granted",
            });

            // resolved at broadcast time
            const txHash = "";

            // build signature on the correct format
            const signature = `${result.signature_compact.toString("base64")}`;

            const operation: Operation = {
              id: encodeOperationId(accountId, txHash, "OUT"),
              hash: txHash,
              type: "OUT",
              senders: [address],
              recipients: [recipient],
              accountId,
              value: amount.plus(fee),
              fee,
              blockHash: null,
              blockHeight: null,
              date: new Date(),
              extra: {
                gasLimit,
                gasFeeCap,
                gasPremium,
                method,
                version,
                nonce,
                signatureType: 1,
              },
            };

            o.next({
              type: "signed",
              signedOperation: {
                operation,
                signature,
                expirationDate: null,
              },
            });
          } finally {
            close(transport, deviceId);

            // log("debug", "[signOperation] finish fn");
          }
        }

        main().then(
          () => o.complete(),
          (e) => o.error(e)
        );
      })
  );

export const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  sync,
  receive,
  broadcast,
  signOperation,
};
