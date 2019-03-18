// @flow
import { atomicQueue } from "../logic/promise";
import type { Core, CoreWallet } from "./types";

export const getOrCreateAccount = atomicQueue(
  async ({
    core,
    coreWallet,
    xpub,
    index,
  }: {
    core: Core,
    coreWallet: CoreWallet,
    xpub: ?string,
    index: number,
  }) => {
    let coreAccount;
    try {
      coreAccount = await coreWallet.getAccount(index);
    } catch (err) {
      const extendedInfos = await coreWallet.getExtendedKeyAccountCreationInfo(
        index,
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
        extendedKeys,
      );

      coreAccount = await coreWallet.newAccountWithExtendedKeyInfo(
        newExtendedKeys,
      );
    }
    return coreAccount;
  },
  ({ xpub }) => xpub || "",
);
