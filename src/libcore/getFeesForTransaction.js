// @flow

import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { Account, Transaction } from "../types";
import { withLibcoreF } from "./access";
import { remapLibcoreErrors } from "./errors";
import { getCoreAccount } from "./getCoreAccount";
import byFamily from "../generated/libcore-getFeesForTransaction";

export type Input = {
  account: Account,
  transaction: Transaction
};

type F = Input => Promise<BigNumber>;

export const getFeesForTransaction: F = withLibcoreF(
  core => async ({ account, transaction }) => {
    try {
      const { currency } = account;
      const { coreWallet, coreAccount } = await getCoreAccount(core, account);

      const coreCurrency = await coreWallet.getCurrency();

      const f = byFamily[currency.family];
      if (!f) throw new Error("currency " + currency.id + " not supported");
      let fees = await f({
        account,
        core,
        coreAccount,
        coreCurrency,
        transaction,
        isPartial: true,
        isCancelled: () => false
      });
      if (!fees) {
        fees = BigNumber(0);
        log("libcore", "getFeesForTransaction: no fees");
      } else if (fees.isLessThan(0)) {
        fees = BigNumber(0);
        log(
          "libcore",
          "getFeesForTransaction: negative fees! " + fees.toString()
        );
      } else {
        log("libcore", "getFeesForTransaction: fees is " + fees.toString());
      }
      return fees;
    } catch (error) {
      throw remapLibcoreErrors(error);
    }
  }
);
