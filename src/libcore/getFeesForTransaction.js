// @flow

import { BigNumber } from "bignumber.js";
import { getWalletName } from "../account";
import type { Account, TokenAccount, Transaction } from "../types";
import { withLibcoreF } from "./access";
import { remapLibcoreErrors } from "./errors";
import { getOrCreateWallet } from "./getOrCreateWallet";
import { getOrCreateAccount } from "./getOrCreateAccount";
import byFamily from "../generated/libcore-getFeesForTransaction";

export type Input = {
  account: Account,
  tokenAccount?: ?TokenAccount,
  transaction: Transaction
};

type F = Input => Promise<BigNumber>;

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
