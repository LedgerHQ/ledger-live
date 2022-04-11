import { getWalletName } from "../account";
import type { NetworkInfo } from "../generated/types";
import type { Account } from "../types";
import { withLibcoreF } from "./access";
import { remapLibcoreErrors } from "./errors";
import { getOrCreateWallet } from "./getOrCreateWallet";
import { getOrCreateAccount } from "./getOrCreateAccount";
import byFamily from "../generated/libcore-getAccountNetworkInfo";

type F = (arg0: Account) => Promise<NetworkInfo>;

export const getAccountNetworkInfo: F = withLibcoreF(
  (core) => async (account) => {
    try {
      const { derivationMode, currency } = account;
      const f = byFamily[currency.family];

      if (!f) {
        throw new Error(
          "getAccountNetworkInfo is not implemented by family " +
            currency.family
        );
      }

      const walletName = getWalletName(account);
      const coreWallet = await getOrCreateWallet({
        core,
        walletName,
        currency,
        derivationMode,
      });
      const coreAccount = await getOrCreateAccount({
        core,
        coreWallet,
        account,
      });
      const res = await f({
        account,
        coreAccount,
      });
      return res;
    } catch (error) {
      throw remapLibcoreErrors(error);
    }
  }
);
