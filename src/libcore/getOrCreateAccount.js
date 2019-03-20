// @flow
import { atomicQueue } from "../promise";
import type { Core, CoreWallet, CoreAccount } from "./types";

type F = ({
  core: Core,
  coreWallet: CoreWallet,
  xpub: ?string,
  index: number
}) => Promise<CoreAccount>;

export const getOrCreateAccount: F = atomicQueue(
  async ({ core, coreWallet, xpub, index }) => {
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

      if (xpub) extendedKeys.push(xpub);

      const newExtendedKeys = await core.ExtendedKeyAccountCreationInfo.init(
        infosIndex,
        owners,
        derivations,
        extendedKeys
      );

      coreAccount = await coreWallet.newAccountWithExtendedKeyInfo(
        newExtendedKeys
      );
    }
    return coreAccount;
  },
  ({ xpub }) => xpub || ""
);
