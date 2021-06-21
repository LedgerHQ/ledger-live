// @flow
import { log } from "@ledgerhq/logs";
import Transport from "@ledgerhq/hw-transport";
import type { Core, CoreWallet, CoreAccount } from "./types";
import type { CryptoCurrency } from "../types";
import type { DerivationMode } from "../derivation";
import getAddress from "../hw/getAddress";

// In order to not re-query the same path, we use a temporary cache
export class DerivationsCache {
  store: { [_: string]: { publicKey: string, chainCode?: string } } = {};
}

type F = ({
  core: Core,
  wallet: CoreWallet,
  transport: typeof Transport,
  currency: CryptoCurrency,
  index: number,
  derivationMode: DerivationMode,
  isUnsubscribed: () => boolean,
  derivationsCache: DerivationsCache,
}) => Promise<?CoreAccount>;

export const createAccountFromDevice: F = async ({
  core,
  wallet,
  transport,
  currency,
  derivationMode,
  isUnsubscribed,
  derivationsCache,
}) => {
  log(
    "libcore",
    "createAccountFromDevice " + currency.id + " " + derivationMode
  );
  const accountCreationInfos = await wallet.getNextAccountCreationInfo();
  if (isUnsubscribed()) return;
  const chainCodes = await accountCreationInfos.getChainCodes();
  if (isUnsubscribed()) return;
  const publicKeys = await accountCreationInfos.getPublicKeys();
  if (isUnsubscribed()) return;
  const index = await accountCreationInfos.getIndex();
  if (isUnsubscribed()) return;
  const derivations = await accountCreationInfos.getDerivations();
  if (isUnsubscribed()) return;
  const owners = await accountCreationInfos.getOwners();
  if (isUnsubscribed()) return;

  await derivations.reduce(
    (promise, derivation) =>
      promise.then(async () => {
        if (isUnsubscribed()) return;

        let cache = derivationsCache.store[derivation];
        if (!cache) {
          cache = await getAddress(transport, {
            currency,
            path: derivation,
            derivationMode,
            askChainCode: true,
            skipAppFailSafeCheck: true,
          });
          derivationsCache.store[derivation] = cache;
        }
        const { publicKey, chainCode } = cache;
        publicKeys.push(publicKey);
        if (chainCode) chainCodes.push(chainCode);
      }),
    Promise.resolve()
  );
  if (isUnsubscribed()) return;

  log("libcore", "AccountCreationInfo.init", {
    index,
    owners,
    derivations,
    publicKeys,
    chainCodes,
  });
  const newAccountCreationInfos = await core.AccountCreationInfo.init(
    index,
    owners,
    derivations,
    publicKeys,
    chainCodes
  );
  if (isUnsubscribed()) return;

  const account = await wallet.newAccountWithInfo(newAccountCreationInfos);
  return account;
};
