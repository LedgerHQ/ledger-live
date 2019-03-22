// @flow
import Btc from "@ledgerhq/hw-app-btc";
import Transport from "@ledgerhq/hw-transport";
import type { Core, CoreWallet } from "./types";

export async function createAccountFromDevice({
  core,
  wallet,
  transport
}: {
  core: Core,
  wallet: CoreWallet,
  transport: Transport<*>
}) {
  const accountCreationInfos = await wallet.getNextAccountCreationInfo();
  const chainCodes = await accountCreationInfos.getChainCodes();
  const publicKeys = await accountCreationInfos.getPublicKeys();
  const index = await accountCreationInfos.getIndex();
  const derivations = await accountCreationInfos.getDerivations();
  const owners = await accountCreationInfos.getOwners();

  const hwApp = new Btc(transport);

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
