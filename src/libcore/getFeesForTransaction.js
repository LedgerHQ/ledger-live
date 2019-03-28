// @flow

import { BigNumber } from "bignumber.js";
import { getWalletName } from "../account";
import type { Account, TokenAccount } from "../types";
import { withLibcoreF } from "./access";
import { remapLibcoreErrors } from "./errors";
import { getOrCreateWallet } from "./getOrCreateWallet";
import { getOrCreateAccount } from "./getOrCreateAccount";
import { libcoreAmountToBigNumber } from "./buildBigNumber";
import * as buildTransaction from "./buildTransaction";
import type { Transaction } from "./buildTransaction";

export type Input = {
  account: Account,
  tokenAccount?: ?TokenAccount,
  transaction: Transaction
};

type F = Input => Promise<BigNumber>;

// NB might regroup later by family

async function bitcoin(arg: *) {
  const builded = await buildTransaction.bitcoin(arg);
  if (!builded) return;
  const feesAmount = await builded.getFees();
  if (!feesAmount) {
    throw new Error("getFeesForTransaction: fees should not be undefined");
  }
  const fees = await libcoreAmountToBigNumber(feesAmount);
  return fees;
}

async function ethereum(arg: *) {
  const builded = await buildTransaction.ethereum(arg);
  if (!builded) return;
  const gasPrice = await libcoreAmountToBigNumber(await builded.getGasPrice());
  const gasLimit = await libcoreAmountToBigNumber(await builded.getGasLimit());
  return gasPrice.times(gasLimit);
}

const byFamily = {
  bitcoin,
  ethereum
};

export const getFeesForTransaction: F = withLibcoreF(
  core => async ({ account, tokenAccount, transaction }) => {
    try {
      const { derivationMode, currency } = account;
      const walletName = getWalletName(account);

      const coreWallet = await getOrCreateWallet({
        core,
        walletName,
        currency,
        derivationMode
      });

      const coreAccount = await getOrCreateAccount({
        core,
        coreWallet,
        account
      });

      const coreCurrency = await coreWallet.getCurrency();

      const f = byFamily[currency.family];
      if (!f) throw new Error("currency " + currency.id + " not supported");
      let fees = await f({
        account,
        tokenAccount,
        core,
        coreAccount,
        coreCurrency,
        transaction,
        isPartial: true,
        isCancelled: () => false
      });
      if (!fees || fees.isLessThan(0)) {
        fees = BigNumber(0);
      }
      return fees;
    } catch (error) {
      throw remapLibcoreErrors(error);
    }
  }
);
