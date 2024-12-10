import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { fetchBalances, fetchBlockHeight, fetchTxns } from "../../api";
import flatMap from "lodash/flatMap";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ICPRosettaGetTxnsHistoryResponse } from "./icpRosetta/types";
import { ICP_FEES } from "../../consts";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { normalizeEpochTimestamp } from "../../common-logic/utils";
import { InternetComputerOperation } from "../../types";
import invariant from "invariant";
import { deriveAddressFromPubkey } from "./icpRosetta";

export const getAccountShape: GetAccountShape = async info => {
  const { currency, derivationMode, rest = {}, initialAccount } = info;
  const publicKey = reconciliatePublicKey(rest.publicKey, initialAccount);
  invariant(publicKey, "publicKey is required");

  // deriving address from public key
  const address = await deriveAddressFromPubkey(publicKey);
  invariant(address, "address is required");

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: publicKey,
    derivationMode,
  });

  // log("debug", `Generation account shape for ${address}`);

  const blockHeight = await fetchBlockHeight();
  const balanceResp = await fetchBalances(address);
  const balance = balanceResp.balances[0];

  const txns = await fetchTxns(address);
  const result: Partial<Account> = {
    id: accountId,
    balance: BigNumber(balance.value),
    spendableBalance: BigNumber(balance.value),
    operations: flatMap(txns.transactions.reverse(), mapTxToOps(accountId, address)),
    blockHeight: blockHeight.current_block_identifier.index,
    operationsCount: txns.transactions.length,
    xpub: publicKey,
  };

  return result;
};

function reconciliatePublicKey(publicKey?: string, initialAccount?: Account): string {
  if (publicKey) return publicKey;
  if (initialAccount) {
    const { xpubOrAddress } = decodeAccountId(initialAccount.id);
    return xpubOrAddress;
  }
  throw new Error("publicKey wasn't properly restored");
}

const mapTxToOps = (accountId: string, address: string, fee = ICP_FEES) => {
  return (
    txInfo: ICPRosettaGetTxnsHistoryResponse["transactions"][0],
  ): InternetComputerOperation[] => {
    const ops: InternetComputerOperation[] = [];
    const ownerOperation = txInfo.transaction.operations.find(
      cur => cur.account.address === address,
    );
    const counterOperation = txInfo.transaction.operations.find(
      cur => cur.account.address !== address,
    );

    if (!ownerOperation || !counterOperation) return ops;

    const timeStamp = txInfo.transaction.metadata.timestamp;
    const amount = BigNumber(ownerOperation.amount.value);
    const hash = txInfo.transaction.transaction_identifier.hash;
    const fromAccount = amount.isPositive()
      ? counterOperation.account.address
      : ownerOperation.account.address;
    const toAccount = amount.isNegative()
      ? counterOperation.account.address
      : ownerOperation.account.address;
    const memo = txInfo.transaction.metadata.memo.toString();
    const blockHeight = txInfo.transaction.metadata.block_height;

    const date = new Date(normalizeEpochTimestamp(timeStamp.toString()));
    const value = amount.abs();
    const feeToUse = BigNumber(fee);

    const isSending = amount.isNegative();
    const isReceiving = amount.isPositive();

    if (isSending) {
      ops.push({
        id: encodeOperationId(accountId, hash, "OUT"),
        hash,
        type: "OUT",
        value: value.plus(feeToUse),
        fee: feeToUse,
        blockHeight,
        blockHash: null,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {
          memo,
        },
      });
    }

    if (isReceiving) {
      ops.push({
        id: encodeOperationId(accountId, hash, "IN"),
        hash,
        type: "IN",
        value,
        fee: feeToUse,
        blockHeight,
        blockHash: null,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {
          memo,
        },
      });
    }

    return ops;
  };
};
