import type { IconAccount, Transaction } from "./types";
import IconService from "icon-sdk-js";
import type { IcxTransaction } from "icon-sdk-js";
import { getNid, getNonce } from "./logic";
import BigNumber from "bignumber.js";
import { RPC_VERSION } from "./constants";

const { IconBuilder, IconConverter } = IconService;

const buildTransferTransaction = (
  a: IconAccount,
  t: Transaction,
  stepLimit?: BigNumber | undefined,
): IcxTransaction => {
  const address = a.freshAddress;
  const icxTransactionBuilder = new IconBuilder.IcxTransactionBuilder();
  const icxTransferData = icxTransactionBuilder
    .from(address)
    .to(t.recipient)
    .value(IconConverter.toHexNumber(t.amount))
    .nid(IconConverter.toHexNumber(getNid(a.currency)))
    .nonce(IconConverter.toHexNumber(getNonce(a)))
    .timestamp(IconConverter.toHexNumber(new Date().getTime() * 1000))
    .version(IconConverter.toHexNumber(RPC_VERSION));
  if (!!stepLimit) {
    icxTransferData.stepLimit(IconConverter.toHexNumber(stepLimit));
  }

  return icxTransferData.build();
};

/**
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const buildTransaction = async (
  a: IconAccount,
  t: Transaction,
  stepLimit?: BigNumber | undefined,
) => {
  let unsigned: IcxTransaction | undefined;
  switch (t.mode) {
    case "send":
      unsigned = buildTransferTransaction(a, t, stepLimit);
      break;
    default:
      throw new Error(`Unsupported transaction mode: ${t.mode}`);
  }
  return {
    unsigned,
  };
};
