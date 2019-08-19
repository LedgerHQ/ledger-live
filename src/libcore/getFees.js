// @flow

import { BigNumber } from "bignumber.js";
import { getWalletName } from "../account";
import type { Account, Unit } from "../types";
import { withLibcoreF } from "./access";
import { remapLibcoreErrors } from "./errors";
import { getOrCreateWallet } from "./getOrCreateWallet";
import { getOrCreateAccount } from "./getOrCreateAccount";
import byFamily from "../generated/libcore-getFees";

export type Input = Account;

export type Output =
  | {
      // btc
      type: "feePerBytes",
      value: BigNumber[]
    }
  | {
      // eth?
      type: "gasPrice",
      value: BigNumber,
      unit: Unit
    }
  | {
      // ripple?
      type: "fee",
      value: BigNumber,
      unit: Unit
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
    const res = await f({
      account,
      coreAccount
    });
    return res;
  } catch (error) {
    throw remapLibcoreErrors(error);
  }
});
