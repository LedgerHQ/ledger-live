// @flow
import type { Core, CoreWallet } from "./types";

export async function createAccountFromDevice({
  core,
  wallet,
  hwApp
}: {
  core: Core,
  wallet: CoreWallet,
  hwApp: *
}) {
  const accountCreationInfos = await wallet.getNextAccountCreationInfo();
  const chainCodes = await accountCreationInfos.getChainCodes();
  const publicKeys = await accountCreationInfos.getPublicKeys();
  const index = await accountCreationInfos.getIndex();
  const derivations = await accountCreationInfos.getDerivations();
  const owners = await accountCreationInfos.getOwners();

  await derivations.reduce(
    (promise, derivation) =>
      promise.then(async () => {
        const { publicKey, chainCode } = await hwApp.getWalletPublicKey(
          derivation
        );
        publicKeys.push(publicKey);
        chainCodes.push(chainCode);
      }),
    Promise.resolve()
  );

  const newAccountCreationInfos = await core.AccountCreationInfo.init(
    index,
    owners,
    derivations,
    publicKeys,
    chainCodes
  );

  return wallet.newAccountWithInfo(newAccountCreationInfos);
}
