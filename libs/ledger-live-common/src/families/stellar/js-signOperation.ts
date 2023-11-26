import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import Stellar from "@ledgerhq/hw-app-str";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Account, SignOperationFnSignature } from "@ledgerhq/types-live";
import { withDevice } from "../../hw/deviceAccess";
import type { StellarOperation, Transaction } from "./types";
import { buildTransaction } from "./js-buildTransaction";
import { fetchSequence } from "./api";
import { getAmountValue } from "./logic";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

const buildOptimisticOperation = async (
  account: Account,
  transaction: Transaction,
): Promise<StellarOperation> => {
  const transactionSequenceNumber = await fetchSequence(account);
  const fees = transaction.fees ?? new BigNumber(0);
  const type = transaction.mode === "changeTrust" ? "OPT_IN" : "OUT";

  const operation: StellarOperation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value: transaction.subAccountId ? fees : getAmountValue(account, transaction, fees),
    fee: fees,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient],
    accountId: account.id,
    date: new Date(),
    // FIXME: Javascript number may be not precise enough
    transactionSequenceNumber: transactionSequenceNumber?.plus(1).toNumber(),
    extra: {
      ledgerOpType: type,
    },
  };

  const { subAccountId } = transaction;
  const { subAccounts } = account;

  const tokenAccount = !subAccountId
    ? null
    : subAccounts && subAccounts.find(ta => ta.id === subAccountId);

  if (tokenAccount && subAccountId) {
    operation.subOperations = [
      {
        id: `${subAccountId}--OUT`,
        hash: "",
        type: "OUT",
        value: transaction.useAllAmount ? tokenAccount.balance : transaction.amount,
        fee: new BigNumber(0),
        blockHash: null,
        blockHeight: null,
        senders: [account.freshAddress],
        recipients: [transaction.recipient],
        accountId: subAccountId,
        date: new Date(),
        extra: {
          ledgerOpType: type,
        },
      },
    ];
  }

  return operation;
};

/**
 * Sign Transaction with Ledger hardware
 */
const signOperation: SignOperationFnSignature<Transaction> = ({ account, deviceId, transaction }) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          o.next({
            type: "device-signature-requested",
          });

          // Fees are loaded during prepareTransaction
          if (!transaction.fees) {
            throw new FeeNotLoaded();
          }

          const unsigned = await buildTransaction(account, transaction);
          const unsignedPayload = unsigned.signatureBase();
          // Sign by device
          const hwApp = new Stellar(transport);
          const { signature } = await hwApp.signTransaction(
            account.freshAddressPath,
            unsignedPayload,
          );
          unsigned.addSignature(account.freshAddress, signature.toString("base64"));
          o.next({
            type: "device-signature-granted",
          });
          const operation = await buildOptimisticOperation(account, transaction);
          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: unsigned.toXDR(),
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

export default signOperation;
