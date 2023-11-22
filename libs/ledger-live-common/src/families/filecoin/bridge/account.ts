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
import { Address } from "@zondax/izari-filecoin/address";
import { Methods } from "@zondax/izari-filecoin/artifacts";

import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import {
  Account,
  AccountBridge,
  AccountLike,
  Operation,
  BroadcastFnSignature,
  SignOperationEvent,
  SignOperationFnSignature,
} from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "../types";
import { getAccountShape, getAddress, getTxToBroadcast } from "./utils/utils";
import { broadcastTx, fetchBalances, fetchEstimatedFees } from "./utils/api";
import { BroadcastBlockIncl } from "./utils/types";
import { getMainAccount } from "../../../account";
import { close } from "../../../hw";
import { toCBOR } from "./utils/serializer";
import { calculateEstimatedFees, getPath, isError } from "../utils";
import { log } from "@ledgerhq/logs";
import { validateAddress } from "./utils/addresses";
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

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  // log("debug", "[getTransactionStatus] start fn");

  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance } = a;
  const { address } = getAddress(a);
  const { recipient, useAllAmount, gasPremium, gasFeeCap, gasLimit } = t;
  let { amount } = t;

  if (!recipient) errors.recipient = new RecipientRequired();
  else if (!validateAddress(recipient).isValid) errors.recipient = new InvalidAddress();
  else if (!validateAddress(address).isValid) errors.sender = new InvalidAddress();

  if (gasFeeCap.eq(0) || gasPremium.eq(0) || gasLimit.eq(0)) errors.gas = new FeeNotLoaded();

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
    } else if (totalSpent.gt(a.spendableBalance)) errors.amount = new NotEnoughBalance();
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
  let { address: sender } = getAddress(a);

  let methodNum = Methods.Transfer;
  let recipient = transaction?.recipient;

  const senderValidation = validateAddress(sender);
  if (!senderValidation.isValid) throw new InvalidAddress();
  sender = senderValidation.parsedAddress.toString();

  if (recipient) {
    const recipientValidation = validateAddress(recipient);
    if (!recipientValidation.isValid) {
      throw new InvalidAddress();
    }
    recipient = recipientValidation.parsedAddress.toString();

    methodNum = Address.isFilEthAddress(recipientValidation.parsedAddress)
      ? Methods.InvokeEVM
      : Methods.Transfer;
  }

  const balances = await fetchBalances(sender);
  let balance = new BigNumber(balances.spendable_balance);

  if (balance.eq(0)) return balance;

  const amount = transaction?.amount;

  const result = await fetchEstimatedFees({
    to: recipient,
    from: sender,
    methodNum,
    blockIncl: BroadcastBlockIncl,
  });
  const gasFeeCap = new BigNumber(result.gas_fee_cap);
  const gasLimit = new BigNumber(result.gas_limit);
  const estimatedFees = calculateEstimatedFees(gasFeeCap, gasLimit);

  if (balance.lte(estimatedFees)) return new BigNumber(0);

  balance = balance.minus(estimatedFees);
  if (amount) balance = balance.minus(amount);

  // log("debug", "[estimateMaxSpendable] finish fn");

  return balance;
};

const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  const { balance } = a;
  const { address } = getAddress(a);
  const { recipient, useAllAmount } = t;

  if (recipient && address) {
    const recipientValidation = validateAddress(recipient);
    const senderValidation = validateAddress(address);

    if (recipientValidation.isValid && senderValidation.isValid) {
      const patch: Partial<Transaction> = {};

      const method = Address.isFilEthAddress(recipientValidation.parsedAddress)
        ? Methods.InvokeEVM
        : Methods.Transfer;

      const result = await fetchEstimatedFees({
        to: recipientValidation.parsedAddress.toString(),
        from: senderValidation.parsedAddress.toString(),
        methodNum: method,
        blockIncl: BroadcastBlockIncl,
      });

      patch.gasFeeCap = new BigNumber(result.gas_fee_cap);
      patch.gasPremium = new BigNumber(result.gas_premium);
      patch.gasLimit = new BigNumber(result.gas_limit);
      patch.nonce = result.nonce;
      patch.method = method;

      const fee = calculateEstimatedFees(patch.gasFeeCap, patch.gasLimit);
      if (useAllAmount) patch.amount = balance.minus(fee);

      return defaultUpdateTransaction(t, patch);
    }
  }

  return t;
};

const sync = makeSync({ getAccountShape });

const broadcast: BroadcastFnSignature = async ({ signedOperation }) => {
  // log("debug", "[broadcast] start fn");
  const { operation, signature, rawData } = signedOperation;
  const tx = getTxToBroadcast(operation, signature, rawData!);

  const resp = await broadcastTx(tx);
  const { hash } = resp;

  const result = patchOperationWithHash(signedOperation.operation, hash);

  // log("debug", "[broadcast] finish fn");

  return result;
};

const signOperation: SignOperationFnSignature<Transaction> = ({
  account,
  deviceId,
  transaction,
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          // log("debug", "[signOperation] start fn");

          const { method, version, nonce, gasFeeCap, gasLimit, gasPremium } = transaction;
          const { amount } = transaction;
          const { id: accountId } = account;
          const { derivationPath } = getAddress(account);

          if (!gasFeeCap.gt(0) || !gasLimit.gt(0)) {
            log(
              "debug",
              `signOperation missingData --> gasFeeCap=${gasFeeCap} gasLimit=${gasLimit}`,
            );
            throw new FeeNotLoaded();
          }

          const filecoin = new Fil(transport);

          try {
            o.next({
              type: "device-signature-requested",
            });

            const fee = calculateEstimatedFees(gasFeeCap, gasLimit);

            // Serialize tx
            const { txPayload, parsedSender, parsedRecipient } = toCBOR(account, transaction);

            log("debug", `[signOperation] serialized CBOR tx: [${txPayload.toString("hex")}]`);

            // Sign by device
            const result = await filecoin.sign(getPath(derivationPath), txPayload);
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
              senders: [parsedSender],
              recipients: [parsedRecipient],
              accountId,
              value: amount.plus(fee),
              fee,
              blockHash: null,
              blockHeight: null,
              date: new Date(),
              extra: {},
            };

            // Necessary for broadcast
            const additionalTxFields = {
              gasLimit,
              gasFeeCap,
              gasPremium,
              method,
              version,
              nonce,
              signatureType: 1,
            };

            o.next({
              type: "signed",
              signedOperation: {
                operation,
                signature,
                rawData: additionalTxFields,
              },
            });
          } finally {
            close(transport, deviceId);

            // log("debug", "[signOperation] finish fn");
          }
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

export const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  sync,
  receive,
  broadcast,
  signOperation,
};
