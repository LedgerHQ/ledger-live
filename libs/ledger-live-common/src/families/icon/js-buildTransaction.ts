import type { IconAccount, Transaction } from "./types";
import IconService from "icon-sdk-js";
import { getNid } from "./logic";
import BigNumber from "bignumber.js";
import { IISS_SCORE_ADDRESS } from "./constants";

const { IconBuilder, IconConverter, IconAmount, IconUtil } = IconService;

/**
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const buildTransaction = async (
  a: IconAccount,
  t: Transaction,
  stepLimit?: BigNumber
) => {
  let icxTxData;
  switch (t.mode) {
    case 'send':
      icxTxData = buildSendingTransaction(a, t, stepLimit);
      break;
    case 'freeze':
      icxTxData = buildStakingTransaction(a, t);
      break;
    default:
      break;
  }

  return {
    unsigned: IconUtil.generateHashKey(
      IconConverter.toRawTransaction(icxTxData)
    ),
    rawTransaction: icxTxData,
  };
};

const buildSendingTransaction = (
  a: IconAccount,
  t: Transaction,
  stepLimit?: BigNumber) => {
  const address = a.freshAddress;

  const icxTransactionBuilder = new IconBuilder.IcxTransactionBuilder();
  let icxTransferData;
  if (stepLimit) {
    icxTransferData = icxTransactionBuilder
      .from(address)
      .to(t.recipient)
      .nid(IconConverter.toHexNumber(getNid(a.currency)))
      .value(
        IconConverter.toHexNumber(
          IconAmount.of(t.amount, IconAmount.Unit.ICX).toLoop()
        )
      )
      .timestamp(IconConverter.toHexNumber(new Date().getTime() * 1000))
      .version(IconConverter.toHexNumber(3))
      .stepLimit(IconConverter.toHexNumber(stepLimit.toNumber()))
      .build();
  } else {
    icxTransferData = icxTransactionBuilder
      .from(address)
      .to(t.recipient)
      .nid(IconConverter.toHexNumber(getNid(a.currency)))
      .value(
        IconConverter.toHexNumber(
          IconAmount.of(t.amount, IconAmount.Unit.ICX).toLoop()
        )
      )
      .timestamp(IconConverter.toHexNumber(new Date().getTime() * 1000))
      .version(IconConverter.toHexNumber(3))
      .build();
  }
  return icxTransferData;
};

const buildStakingTransaction = (
  a: IconAccount,
  t: Transaction) => {

  const address = a.freshAddress;
  const icxCallTxBuilder = new IconBuilder.CallBuilder();

  let icxTransferData = icxCallTxBuilder
    .from(address)
    .to(IISS_SCORE_ADDRESS)
    .method('setStake')
    .params({
      value: IconConverter.toHexNumber(
        IconAmount.of(t.amount, IconAmount.Unit.ICX).toLoop()
      )
    }).build();

  return icxTransferData;
};