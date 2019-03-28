// @flow
import invariant from "invariant";
import type { Account } from "../types";
import { atomicQueue } from "../promise";
import type { Core, CoreWallet, CoreAccount } from "./types";

type Param = {
  core: Core,
  coreWallet: CoreWallet,
  account: Account
};
type F = Param => Promise<CoreAccount>;

export const getOrCreateAccount: F = atomicQueue(
  async ({ core, coreWallet, account: { xpub, index } }) => {
    let coreAccount;
    try {
      coreAccount = await coreWallet.getAccount(index);
    } catch (err) {
      const extendedInfos = await coreWallet.getExtendedKeyAccountCreationInfo(
        index
      );
      const infosIndex = await extendedInfos.getIndex();
      const extendedKeys = await extendedInfos.getExtendedKeys();
      const owners = await extendedInfos.getOwners();
      const derivations = await extendedInfos.getDerivations();
      invariant(xpub, "xpub is missing. Please reimport the account.");
      extendedKeys.push(xpub);
      const newExtendedKeys = await core.ExtendedKeyAccountCreationInfo.init(
        infosIndex,
        owners,
        derivations,
        extendedKeys
      );
      const account = await coreWallet.newAccountWithExtendedKeyInfo(
        newExtendedKeys
      );
      return account;
    }
    return coreAccount;
  },
  ({ account }) => account.id || ""
);
