import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { Address } from "@elrondnetwork/erdjs/out";
import type {
  ElrondProtocolTransaction,
  ElrondTransactionMode,
  Transaction,
} from "./types";
import { withDevice } from "../../hw/deviceAccess";
import { encodeOperationId } from "../../operation";
import Elrond from "./hw-app-elrond";
import { buildTransactionToSign } from "./js-buildTransaction";
import { CHAIN_ID } from "./constants";
import {
  Account,
  Operation,
  OperationType,
  SignedOperation,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import { BinaryUtils } from "./utils/binary.utils";
import { decodeTokenAccountId } from "../../account";
import { extractTokenId } from "./logic";

function getOptimisticOperationType(
  transactionMode: ElrondTransactionMode
): OperationType {
  switch (transactionMode) {
    case "delegate":
      return "DELEGATE";
    case "unDelegate":
      return "UNDELEGATE";
    case "withdraw":
      return "WITHDRAW_UNBONDED";
    case "claimRewards":
      return "REWARD";
    case "reDelegateRewards":
      return "DELEGATE";
    default:
      return "OUT";
  }
}

function getOptimisticOperationDelegationAmount(
  transaction: Transaction
): BigNumber | undefined {
  let dataDecoded;
  switch (transaction.mode) {
    case "delegate":
      return transaction.amount;

    case "unDelegate":
      dataDecoded = BinaryUtils.base64Decode(transaction.data ?? "");
      return new BigNumber(`0x${dataDecoded.split("@")[1]}`);

    default:
      return new BigNumber(0);
  }
}

const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  unsignedTx: ElrondProtocolTransaction
): Operation => {
  const senders = [account.freshAddress];
  const recipients = [transaction.recipient];
  const { subAccountId, fees } = transaction;

  if (!fees) {
    throw new FeeNotLoaded();
  }

  const type = getOptimisticOperationType(transaction.mode);

  const tokenAccount =
    (subAccountId &&
      account.subAccounts &&
      account.subAccounts.find((ta) => ta.id === subAccountId)) ||
    null;

  const value =
    tokenAccount || transaction.mode !== "send"
      ? fees
      : transaction.amount.plus(transaction.fees || new BigNumber(0));

  const delegationAmount = getOptimisticOperationDelegationAmount(transaction);

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee: fees,
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId: account.id,
    transactionSequenceNumber: unsignedTx.nonce,
    date: new Date(),
    contract: new Address(transaction.recipient).isContractAddress()
      ? transaction.recipient
      : undefined,
    extra: {
      amount: delegationAmount,
    },
  };

  if (tokenAccount && subAccountId) {
    operation.subOperations = [
      {
        id: encodeOperationId(subAccountId, "", "OUT"),
        hash: "",
        type: "OUT",
        value: transaction.amount,
        fee: new BigNumber(0),
        blockHash: null,
        blockHeight: null,
        senders,
        recipients,
        accountId: subAccountId,
        date: new Date(),
        extra: {},
      },
    ];
  }

  return operation;
};

/**
 * Sign Transaction with Ledger hardware
 */
const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account;
  deviceId: any;
  transaction: Transaction;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)((transport) =>
    Observable.create((o) => {
      async function main() {
        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }
        // Collect data for an ESDT transfer
        const { subAccounts } = account;
        const { subAccountId } = transaction;
        const tokenAccount = !subAccountId
          ? null
          : subAccounts && subAccounts.find((ta) => ta.id === subAccountId);

        const elrond = new Elrond(transport);
        await elrond.setAddress(account.freshAddressPath);

        if (tokenAccount) {
          const { token } = decodeTokenAccountId(tokenAccount.id);

          if (token?.name && token.id && token.ledgerSignature) {
            await elrond.provideESDTInfo(
              token.name,
              extractTokenId(token.id),
              token?.units[0].magnitude,
              CHAIN_ID,
              token.ledgerSignature
            );
          }
        }

        const unsignedTx: string = await buildTransactionToSign(
          account,
          transaction
        );

        o.next({
          type: "device-signature-requested",
        });

        const r = await elrond.signTransaction(
          account.freshAddressPath,
          unsignedTx,
          true
        );

        o.next({
          type: "device-signature-granted",
        });

        const parsedUnsignedTx = JSON.parse(unsignedTx);

        const operation = buildOptimisticOperation(
          account,
          transaction,
          parsedUnsignedTx
        );

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: r,
            expirationDate: null,
            signatureRaw: parsedUnsignedTx,
          } as SignedOperation,
        });
      }

      main().then(
        () => o.complete(),
        (e) => o.error(e)
      );
    })
  );

export default signOperation;
