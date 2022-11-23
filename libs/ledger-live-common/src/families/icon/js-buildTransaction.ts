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
  let iconTxData;
  switch (t.mode) {
    case 'send':
      iconTxData = buildSendingTransaction(a, t, stepLimit);
      break;
    case 'freeze':
      iconTxData = buildStakingTransaction(a, t);
      break;
    case 'vote':
      iconTxData = buildVotingTransaction(a, t);
    default:
      break;
  }

  return {
    unsigned: IconUtil.generateHashKey(
      IconConverter.toRawTransaction(iconTxData)
    ),
    rawTransaction: iconTxData,
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
  const icxTransferData = new IconBuilder.CallTransactionBuilder()
    .method('setStake')
    .params({
      value: IconConverter.toHexNumber(
        IconAmount.of(t.amount, IconAmount.Unit.ICX).toLoop()
      )
    })
    .from(address)
    .to(IISS_SCORE_ADDRESS)
    .nid(IconConverter.toHexNumber(getNid(a.currency)))
    .timestamp(IconConverter.toHexNumber(new Date().getTime() * 1000))
    .stepLimit(IconConverter.toHexNumber(IconConverter.toBigNumber(70000000)))
    .version(IconConverter.toHexNumber(IconConverter.toBigNumber(3)))
    .build();

  return icxTransferData;
};

const buildVotingTransaction = (
  a: IconAccount,
  t: Transaction) => {

  const address = a.freshAddress;
  const votes = t?.votes || [];
  const icxTransferData = new IconBuilder.CallTransactionBuilder()
    .method('setDelegation')
    .params({
      delegations: votes.map(item => {
        return {
          ...item, value: IconConverter.toHexNumber(
            IconAmount.of(item.value, IconAmount.Unit.ICX).toLoop()
          )
        };
      })
    })
    .from(address)
    .to(IISS_SCORE_ADDRESS)
    .nid(IconConverter.toHexNumber(getNid(a.currency)))
    .timestamp(IconConverter.toHexNumber(new Date().getTime() * 1000))
    .stepLimit(IconConverter.toHexNumber(IconConverter.toBigNumber(70000000)))
    .version(IconConverter.toHexNumber(IconConverter.toBigNumber(3)))
    .build();

  return icxTransferData;
};