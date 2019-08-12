// @flow

import { BigNumber } from "bignumber.js";
import { getWalletName } from "../account";
import type { Account } from "../types";
import { withLibcoreF } from "./access";
import { remapLibcoreErrors } from "./errors";
import { getOrCreateWallet } from "./getOrCreateWallet";
import { getOrCreateAccount } from "./getOrCreateAccount";
import byFamily from "../generated/libcore-getFees";

export type Input = {
  account: Account
};

export type Output =
  | {
      // btc
      type: "feePerBytes",
      value: BigNumber[]
    }
  | {
      // eth?
      type: "gas",
      value: BigNumber
    }
  | {
      // ripple?
      type: "fee",
      value: BigNumber
    };

type F = Input => Promise<Output>;

export const getFees: F = withLibcoreF(core => async account => {
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

    const f = byFamily[currency.family];
    if (!f) throw new Error("currency " + currency.id + " not supported");
    return await f({
      account,
      coreAccount
    });
  } catch (error) {
    throw remapLibcoreErrors(error);
  }
});
