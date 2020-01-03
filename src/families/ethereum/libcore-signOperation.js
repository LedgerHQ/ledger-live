// @flow

import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import Eth from "@ledgerhq/hw-app-eth";
import { byContractAddress } from "@ledgerhq/hw-app-eth/erc20";
import type { CoreEthereumLikeTransaction, Transaction } from "./types";
import type { Operation } from "../../types";
import { makeSignOperation } from "../../libcore/signOperation";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";
import buildTransaction from "./libcore-buildTransaction";

async function signTransaction({
  account: {
    freshAddress,
    freshAddressPath,
    balance,
    id: accountId,
    subAccounts
  },
  transport,
  transaction,
  coreTransaction,
  onDeviceSignatureGranted,
  onDeviceSignatureRequested
}) {
  // sign with device

  const hwApp = new Eth(transport);
  const subAccount =
    transaction.subAccountId && subAccounts
      ? subAccounts.find(t => t.id === transaction.subAccountId)
      : null;

  if (subAccount && subAccount.type === "TokenAccount") {
    const { token } = subAccount;
    const tokenInfo = byContractAddress(token.contractAddress);
    invariant(
      tokenInfo,
      `contract ${token.contractAddress} data for ${token.id} ERC20 not found`
    );
    await hwApp.provideERC20TokenInformation(tokenInfo);
  }

  const serialized = await coreTransaction.serialize();

  onDeviceSignatureRequested();
  const result = await hwApp.signTransaction(freshAddressPath, serialized);
  onDeviceSignatureGranted();

  await coreTransaction.setSignature(result.v, result.r, result.s);
  const signature = await coreTransaction.serialize();

  // build optimistic operation

  const txHash = ""; // resolved at broadcast time
  const senders = [freshAddress];
  const receiver = await coreTransaction.getReceiver();
  const recipients = [await receiver.toEIP55()];
  const gasPrice = await libcoreAmountToBigNumber(
    await coreTransaction.getGasPrice()
  );
  const gasLimit = await libcoreAmountToBigNumber(
    await coreTransaction.getGasLimit()
  );
  const fee = gasPrice.times(gasLimit);
  const transactionSequenceNumber = await coreTransaction.getNonce();
  const { subAccountId } = transaction;

  const operation: $Exact<Operation> = {
    id: `${accountId}-${txHash}-OUT`,
    hash: txHash,
    transactionSequenceNumber,
    type: "OUT",
    value: subAccountId
      ? fee
      : transaction.useAllAmount
      ? balance
      : BigNumber(transaction.amount || 0).plus(fee),
    fee,
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId,
    date: new Date(),
    extra: {}
  };

  if (subAccountId && subAccount) {
    operation.subOperations = [
      {
        id: `${subAccountId}-${txHash}-OUT`,
        hash: txHash,
        transactionSequenceNumber,
        type: "OUT",
        value:
          transaction.useAllAmount && subAccount
            ? subAccount.balance
            : BigNumber(transaction.amount || 0),
        fee,
        blockHash: null,
        blockHeight: null,
        senders,
        recipients: [transaction.recipient],
        accountId: subAccountId,
        date: new Date(),
        extra: {}
      }
    ];
  }

  return {
    operation,
    signature,
    expirationDate: null
  };
}

export default makeSignOperation<Transaction, CoreEthereumLikeTransaction>({
  buildTransaction,
  signTransaction
});
