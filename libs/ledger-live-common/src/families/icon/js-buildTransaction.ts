import type { IconAccount, Transaction } from "./types";
import IconService from "icon-sdk-js";
import { getNid } from "./logic";
import BigNumber from "bignumber.js";
import { RPC_VERSION } from "./constants";

const { IconBuilder, IconConverter, IconAmount, IconUtil } = IconService;

/**
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const buildTransaction = async (a: IconAccount, t: Transaction, stepLimit?: BigNumber) => {
  let iconTxData;
  switch (t.mode) {
    case "send":
      iconTxData = buildSendingTransaction(a, t, stepLimit);
      break;
    default:
      break;
  }

  return {
    unsigned: IconUtil.generateHashKey(IconConverter.toRawTransaction(iconTxData)),
    rawTransaction: iconTxData,
  };
};

const buildSendingTransaction = (a: IconAccount, t: Transaction, stepLimit?: BigNumber) => {
  const address = a.freshAddress;

  const icxTransactionBuilder = new IconBuilder.IcxTransactionBuilder();
  const icxTransferData = icxTransactionBuilder
    .from(address)
    .to(t.recipient)
    .nid(IconConverter.toHexNumber(getNid(a.currency)))
    .value(IconConverter.toHexNumber(IconAmount.of(t.amount, IconAmount.Unit.ICX).toLoop()))
    .timestamp(IconConverter.toHexNumber(new Date().getTime() * 1000))
    .version(IconConverter.toHexNumber(RPC_VERSION));
  if (stepLimit) {
    icxTransferData.stepLimit(IconConverter.toHexNumber(stepLimit.toNumber()));
  }

  return icxTransferData.build();
};
