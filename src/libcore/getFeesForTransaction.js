// @flow

import { BigNumber } from "bignumber.js";
import type { Account, Transaction } from "../types";
import { withLibcoreF } from "./access";
import { remapLibcoreErrors } from "./errors";
import { getCoreAccount } from "./getCoreAccount";
import byFamily from "../generated/libcore-getFeesForTransaction";

export type Input = {
  account: Account,
  transaction: Transaction
};

type F = Input => Promise<{
  estimatedFees: BigNumber,
  value: BigNumber
}>;

export const getFeesForTransaction: F = withLibcoreF(
  core => async ({ account, transaction }) => {
    try {
      const { currency } = account;
      const { coreWallet, coreAccount } = await getCoreAccount(core, account);

      const coreCurrency = await coreWallet.getCurrency();

      const f = byFamily[currency.family];
      if (!f) throw new Error("currency " + currency.id + " not supported");
      const fees = await f({
        account,
        core,
        coreAccount,
        coreCurrency,
        transaction,
        isPartial: true,
        isCancelled: () => false
      });
      return fees;
    } catch (error) {
      throw remapLibcoreErrors(error);
    }
  }
);
