import { BigNumber } from "bignumber.js";
import { Account, Operation, OperationType } from "@ledgerhq/types-live";
import {
  makeUnsignedSTXTokenTransfer,
  UnsignedTokenTransferOptions,
  createMessageSignature,
  deserializeCV,
  cvToJSON,
} from "@stacks/transactions";

import { decodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { fetchFullMempoolTxs, fetchNonce } from "../../bridge/utils/api";
import {
  DecodedSendManyFunctionArgsCV,
  MempoolTransaction,
  StacksNetwork,
  TransactionResponse,
} from "./api.types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { encodeOperationId, encodeSubOperationId } from "@ledgerhq/coin-framework/operation";
import { StacksOperation } from "../../types";
import { log } from "@ledgerhq/logs";

export const getTxToBroadcast = async (
  operation: StacksOperation,
  signature: string,
  rawData: Record<string, any>,
): Promise<Buffer> => {
  const {
    value,
    recipients,
    fee,
    extra: { memo },
  } = operation;

  const { anchorMode, network, xpub } = rawData;

  const options: UnsignedTokenTransferOptions = {
    amount: BigNumber(value).minus(fee).toFixed(),
    recipient: recipients[0],
    anchorMode,
    memo,
    network: StacksNetwork[network],
    publicKey: xpub,
    fee: BigNumber(fee).toFixed(),
    nonce: operation.transactionSequenceNumber ?? 0,
  };

  const tx = await makeUnsignedSTXTokenTransfer(options);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore need to ignore the TS error here
  tx.auth.spendingCondition.signature = createMessageSignature(signature);

  return Buffer.from(tx.serialize());
};

export const getUnit = () => getCryptoCurrencyById("stacks").units[0];

export const getAddress = (
  account: Account,
): {
  address: string;
  derivationPath: string;
} => ({ address: account.freshAddress, derivationPath: account.freshAddressPath });

const getMemo = (memoHex?: string): string => {
  if (memoHex?.substring(0, 2) === "0x") {
    return Buffer.from(memoHex.substring(2), "hex").toString().replaceAll("\x00", "");
  }

  return "";
};

export const mapPendingTxToOps =
  (accountID: string, address: string) =>
  (tx: MempoolTransaction): StacksOperation[] => {
    const { sender_address, receipt_time, fee_rate, tx_id, token_transfer, tx_status, nonce } = tx;
    if (tx.tx_type !== "token_transfer" || tx_status !== "pending") {
      return [];
    }

    const memo = getMemo(token_transfer.memo);
    const feeToUse = new BigNumber(fee_rate || "0");

    const date = new Date(receipt_time * 1000);

    const operationCommons = {
      hash: tx_id,
      fee: feeToUse,
      accountId: accountID,
      senders: [sender_address],
      recipients: [token_transfer.recipient_address],
      transactionSequenceNumber: nonce,
      value: new BigNumber(token_transfer.amount).plus(feeToUse),
      date,
      extra: {
        memo,
      },
      blockHeight: null,
      blockHash: null,
    };

    const isSending = address === sender_address;
    const isReceiving = token_transfer.recipient_address === address;

    const ops: StacksOperation[] = [];
    if (isSending) {
      const type: OperationType = "OUT";
      ops.push({
        ...operationCommons,
        id: encodeOperationId(accountID, tx_id, type),
        type,
      });
    } else if (isReceiving) {
      const type: OperationType = "IN";
      ops.push({
        ...operationCommons,
        id: encodeOperationId(accountID, tx_id, type),
        type,
      });
    }

    return ops;
  };

export const mapTxToOps =
  (accountID: string, address: string) =>
  (tx: TransactionResponse): StacksOperation[] => {
    try {
      const {
        tx_id,
        fee_rate,
        nonce,
        block_height,
        burn_block_time,
        sender_address,
        block_hash: blockHash,
      } = tx.tx;
      const { stx_received: receivedValue, stx_sent: sentValue } = tx;

      let recipients: string[] = [];
      if (tx.tx.tx_type === "token_transfer" && tx.tx.token_transfer) {
        recipients = [tx.tx.token_transfer.recipient_address];
      }

      const memoHex = tx.tx.token_transfer?.memo;
      const memo: string = getMemo(memoHex ?? "");

      const ops: StacksOperation[] = [];

      const date = new Date(burn_block_time * 1000);
      const feeToUse = new BigNumber(fee_rate || "0");

      const isSending = sentValue !== "0" && receivedValue === "0";
      const isReceiving = receivedValue !== "0";

      const operationCommons = {
        hash: tx_id,
        blockHeight: block_height,
        blockHash,
        fee: feeToUse,
        accountId: accountID,
        senders: [sender_address],
        transactionSequenceNumber: nonce,
        date,
        extra: {
          memo,
        },
      };

      if (isSending) {
        const type: OperationType = "OUT";
        let internalOperations: StacksOperation[] | undefined = undefined;

        if (tx.tx.tx_type === "contract_call" && tx.tx.contract_call) {
          internalOperations = [];
          const deserialized = deserializeCV(tx.tx.contract_call.function_args[0].hex);
          const decodedArgs: DecodedSendManyFunctionArgsCV = cvToJSON(deserialized);
          for (const [idx, t] of decodedArgs.value.entries()) {
            internalOperations.push({
              ...operationCommons,
              id: encodeSubOperationId(accountID, tx_id, type, idx),
              contract: "send-many",
              type,
              value: new BigNumber(t.value.ustx.value),
              senders: [sender_address],
              recipients: [t.value.to.value],
              extra: {
                memo: getMemo(t.value.memo?.value ?? ""),
              },
            });
          }
        }

        ops.push({
          ...operationCommons,
          id: encodeOperationId(accountID, tx_id, type),
          value: new BigNumber(sentValue),
          recipients,
          type,
          internalOperations,
        });
      }

      if (isReceiving) {
        const type: OperationType = "IN";
        ops.push({
          ...operationCommons,
          id: encodeOperationId(accountID, tx_id, type),
          value: new BigNumber(receivedValue),
          recipients: recipients.length ? recipients : [address],
          type,
        });
      }

      return ops;
    } catch (err) {
      log("warn", "mapTxToOps failed for stacks", err);
      return [];
    }
  };

export function reconciliatePublicKey(
  publicKey: string | undefined,
  initialAccount: Account | undefined,
): string {
  if (publicKey) return publicKey;
  if (initialAccount) {
    const { xpubOrAddress } = decodeAccountId(initialAccount.id);
    return xpubOrAddress;
  }
  throw new Error("publicKey wasn't properly restored");
}

export const findNextNonce = async (
  senderAddress: string,
  pendingOps: Operation[],
): Promise<BigNumber> => {
  let nextNonce = BigNumber(0);

  for (const op of pendingOps) {
    const nonce = op.transactionSequenceNumber
      ? new BigNumber(op.transactionSequenceNumber)
      : new BigNumber(0);

    if (nonce.gt(nextNonce)) {
      nextNonce = nonce;
    }
  }

  const allMempoolTxns = await fetchFullMempoolTxs(senderAddress);
  for (const tx of allMempoolTxns) {
    const nonce = BigNumber(tx.nonce);
    if (nonce.gt(nextNonce)) {
      nextNonce = nonce;
    }
  }

  if (!nextNonce.eq(0)) {
    nextNonce = nextNonce.plus(1);
  }

  const nonceResp = await fetchNonce(senderAddress);
  const possibleNextNonce = new BigNumber(nonceResp.possible_next_nonce);
  if (possibleNextNonce.gt(nextNonce)) {
    nextNonce = possibleNextNonce;
  }

  return nextNonce;
};
