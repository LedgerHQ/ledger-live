import type { IconAccount, Transaction } from "./types";
import IconService from "icon-sdk-js";
import { getNid } from "./logic";
import BigNumber from "bignumber.js";

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

  return {
    unsigned: IconUtil.generateHashKey(
      IconConverter.toRawTransaction(icxTransferData)
    ),
    rawTransaction: icxTransferData,
  };
};
