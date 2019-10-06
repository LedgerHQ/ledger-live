// @flow
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import Transport from "@ledgerhq/hw-transport";
import type { Core, CoreWallet, CoreAccount } from "./types";
import type { CryptoCurrency } from "../types";
import type { DerivationMode } from "../derivation";
import getAddress from "../hw/getAddress";

type F = ({
  core: Core,
  wallet: CoreWallet,
  transport: Transport<*>,
  currency: CryptoCurrency,
  index: number,
  derivationMode: DerivationMode,
  isUnsubscribed: () => boolean
}) => Promise<?CoreAccount>;

export const createAccountFromDevice: F = async ({
  core,
  wallet,
  transport,
  currency,
  derivationMode,
  isUnsubscribed
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
        const { publicKey, chainCode } = await getAddress(transport, {
          currency,
          path:
            derivationMode === "tezbox"
              ? "44'/1729'/0'/0'" // FIXME LIBCORE
              : derivation,
          derivationMode,
          askChainCode: true,
          skipAppFailSafeCheck: true
        });
        invariant(chainCode, "createAccountFromDevice: chainCode is required");
        publicKeys.push(publicKey);
        chainCodes.push(chainCode);
      }),
    Promise.resolve()
  );
  if (isUnsubscribed()) return;

  log("libcore", "AccountCreationInfo.init", {
    index,
    owners,
    derivations,
    publicKeys,
    chainCodes
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
