// @flow
import { getValue } from "./specific";
import { atomicQueue } from "../logic/promise";

export const getOrCreateAccount = atomicQueue(
  async ({ core, coreWallet, xpub, index }) => {
    let coreAccount;
    try {
      coreAccount = await core.coreWallet.getAccount(coreWallet, index);
    } catch (err) {
      const extendedInfos = await core.coreWallet.getExtendedKeyAccountCreationInfo(
        coreWallet,
        index,
      );

      const infosIndex = (await core.coreExtendedKeyAccountCreationInfo.getIndex(
        extendedInfos,
      )).value; // TODO get rid of .value

      const extendedKeys = getValue(
        await core.coreExtendedKeyAccountCreationInfo.getExtendedKeys(
          extendedInfos,
        ),
      );
      const owners = getValue(
        await core.coreExtendedKeyAccountCreationInfo.getOwners(extendedInfos),
      );
      const derivations = getValue(
        await core.coreExtendedKeyAccountCreationInfo.getDerivations(
          extendedInfos,
        ),
      );

      extendedKeys.push(xpub);

      const newExtendedKeys = await core.coreExtendedKeyAccountCreationInfo.init(
        infosIndex,
        owners,
        derivations,
        extendedKeys,
      );

      coreAccount = await core.coreWallet.newAccountWithExtendedKeyInfo(
        coreWallet,
        newExtendedKeys,
      );
    }
    return coreAccount;
  },
  ({ xpub }) => xpub || "",
);
