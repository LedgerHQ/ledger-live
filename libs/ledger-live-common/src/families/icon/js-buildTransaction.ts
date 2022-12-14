import type { IconAccount, Transaction } from "./types";
import IconService from "icon-sdk-js";
import { getNid } from "./logic";
import BigNumber from "bignumber.js";
import { IISS_SCORE_ADDRESS, RPC_VERSION } from "./constants";

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
    case 'unfreeze':
    case 'freeze':
      iconTxData = buildStakingTransaction(a, t, stepLimit);
      break;
    case 'vote':
      iconTxData = buildVotingTransaction(a, t, stepLimit);
      break;
    case 'claimReward':
      iconTxData = buildClaimIScoreTransaction(a, t, stepLimit);
      break;
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
  const icxTransferData = icxTransactionBuilder
    .from(address)
    .to(t.recipient)
    .nid(IconConverter.toHexNumber(getNid(a.currency)))
    .value(
      IconConverter.toHexNumber(
        IconAmount.of(t.amount, IconAmount.Unit.ICX).toLoop()
      )
    )
    .timestamp(IconConverter.toHexNumber(new Date().getTime() * 1000))
    .version(IconConverter.toHexNumber(RPC_VERSION));
  if (stepLimit) {
    icxTransferData.stepLimit(IconConverter.toHexNumber(stepLimit.toNumber()));
  }

  return icxTransferData.build();
};

const buildStakingTransaction = (
  a: IconAccount,
  t: Transaction,
  stepLimit?: BigNumber) => {
  const { iconResources } = a;
  let amount = t.amount;
  if (t.mode == 'freeze') {
    amount = t.amount.plus(iconResources.totalDelegated);
  } else {
    amount = BigNumber(iconResources.votingPower).minus(t.amount).plus(a.iconResources?.totalDelegated || 0);
  }

  return buildCallTrantraction(a, t, 'setStake', {
    value: IconConverter.toHexNumber(
      IconAmount.of(amount, IconAmount.Unit.ICX).toLoop()
    )
  }, stepLimit);
};

const buildVotingTransaction = (
  a: IconAccount,
  t: Transaction,
  stepLimit?: BigNumber) => {

  const votes = t?.votes || [];

  return buildCallTrantraction(a, t, 'setDelegation', {
    delegations: votes.map(item => {
      return {
        ...item, value: IconConverter.toHexNumber(
          IconAmount.of(item.value, IconAmount.Unit.ICX).toLoop()
        )
      };
    })
  }, stepLimit);
};

const buildClaimIScoreTransaction = (
  a: IconAccount,
  t: Transaction, stepLimit) => {
  return buildCallTrantraction(a, t, 'claimIScore', {}, stepLimit);
};

const buildCallTrantraction = (a: IconAccount, t: Transaction, method: string, param: any, stepLimit?: BigNumber) => {
  const address = a.freshAddress;

  const icxTransferData = new IconBuilder.CallTransactionBuilder()
    .method(method)
    .params({ ...param })
    .from(address)
    .to(IISS_SCORE_ADDRESS)
    .nid(IconConverter.toHexNumber(getNid(a.currency)))
    .timestamp(IconConverter.toHexNumber(new Date().getTime() * 1000))
    .version(IconConverter.toHexNumber(IconConverter.toBigNumber(3)));
  if (stepLimit) {
    icxTransferData.stepLimit(IconConverter.toHexNumber(stepLimit.toNumber()));
  }

  return icxTransferData.build();
};