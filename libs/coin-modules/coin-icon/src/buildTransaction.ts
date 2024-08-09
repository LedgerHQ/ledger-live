import type { IconAccount, Transaction } from "./types";
import IconService from "icon-sdk-js";
import type { IcxTransaction } from "icon-sdk-js";
import { getNid, getNonce } from "./logic";
import BigNumber from "bignumber.js";
import { RPC_VERSION } from "./constants";

const { IconBuilder, IconConverter } = IconService;

const buildTransferTransaction = (
  account: IconAccount,
  transaction: Transaction,
  stepLimit?: BigNumber | undefined,
): IcxTransaction => {
  const address = account.freshAddress;
  const icxTransactionBuilder = new IconBuilder.IcxTransactionBuilder();
  const icxTransferData = icxTransactionBuilder
    .from(address)
    .to(transaction.recipient)
    .value(IconConverter.toHexNumber(transaction.amount))
    .nid(IconConverter.toHexNumber(getNid(account.currency)))
    .nonce(IconConverter.toHexNumber(getNonce(account)))
    .timestamp(IconConverter.toHexNumber(new Date().getTime() * 1000))
    .version(IconConverter.toHexNumber(RPC_VERSION));
  if (stepLimit) {
    icxTransferData.stepLimit(IconConverter.toHexNumber(stepLimit));
  }

  return icxTransferData.build();
};

/**
 *
 * @param {Account} account
 * @param {Transaction} transaction
 */
export const buildTransaction = async (
  account: IconAccount,
  transaction: Transaction,
  stepLimit?: BigNumber | undefined,
) => {
  let unsigned: IcxTransaction | undefined;
  switch (transaction.mode) {
    case "send":
      unsigned = buildTransferTransaction(account, transaction, stepLimit);
      break;
    default:
      throw new Error(`Unsupported transaction mode: ${transaction.mode}`);
  }
  return {
    unsigned,
  };
};
