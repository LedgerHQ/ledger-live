import type { Account } from "../types";
import type { Core, CoreWallet, CoreAccount } from "./types";
import { getWalletName } from "../account";
import { getOrCreateWallet } from "./getOrCreateWallet";
import { getOrCreateAccount } from "./getOrCreateAccount";

export const getCoreAccount = async (
  core: Core,
  account: Account
): Promise<{
  coreWallet: CoreWallet;
  coreAccount: CoreAccount;
  walletName: string;
}> => {
  const { currency, derivationMode, seedIdentifier } = account;
  const walletName = getWalletName({
    currency,
    seedIdentifier,
    derivationMode,
  });
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
  return {
    walletName,
    coreWallet,
    coreAccount,
  };
};
