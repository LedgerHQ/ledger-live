// @flow

import { getValue } from "./specific";

export async function createAccountFromDevice({
  core,
  wallet,
  hwApp,
}: {
  core: *,
  wallet: *,
  hwApp: *,
}) {
  const accountCreationInfos = await core.coreWallet.getNextAccountCreationInfo(
    wallet,
  );
  const chainCodes = getValue(
    await core.coreAccountCreationInfo.getChainCodes(accountCreationInfos),
  );
  const publicKeys = getValue(
    await core.coreAccountCreationInfo.getPublicKeys(accountCreationInfos),
  );
  const index = (await core.coreAccountCreationInfo.getIndex(
    accountCreationInfos,
  )).value;
  const derivations = getValue(
    await core.coreAccountCreationInfo.getDerivations(accountCreationInfos),
  );
  const owners = getValue(
    await core.coreAccountCreationInfo.getOwners(accountCreationInfos),
  );

  await derivations.reduce(
    (promise, derivation) =>
      promise.then(async () => {
        const { publicKey, chainCode } = await hwApp.getWalletPublicKey(
          derivation,
        );
        publicKeys.push(publicKey);
        chainCodes.push(chainCode);
      }),
    Promise.resolve(),
  );

  const newAccountCreationInfos = await core.coreAccountCreationInfo.init(
    index,
    owners,
    derivations,
    publicKeys,
    chainCodes,
  );

  return core.coreWallet.newAccountWithInfo(wallet, newAccountCreationInfos);
}
