import { log } from "@ledgerhq/logs";
import type { Core, CoreWallet, CoreAccount } from "./types";
import type { CryptoCurrency } from "../types";
import type { DerivationMode } from "../derivation";
import { GetAddressOptions, Result } from "../hw/getAddress/types";

// In order to not re-query the same path, we use a temporary cache
export class DerivationsCache {
  store: Record<
    string,
    {
      publicKey: string;
      chainCode?: string;
    }
  > = {};
}

type F = (arg0: {
  core: Core;
  wallet: CoreWallet;
  currency: CryptoCurrency;
  index: number;
  derivationMode: DerivationMode;
  isUnsubscribed: () => boolean;
  derivationsCache: DerivationsCache;
  getAddress: (opts: GetAddressOptions) => Promise<Result>;
}) => Promise<CoreAccount | null | undefined>;

export const createAccountFromDevice: F = async ({
  core,
  wallet,
  currency,
  derivationMode,
  isUnsubscribed,
  derivationsCache,
  getAddress,
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
          cache = await getAddress({
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
