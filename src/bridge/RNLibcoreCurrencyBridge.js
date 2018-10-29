// @flow

import { Observable } from "rxjs";
import Btc from "@ledgerhq/hw-app-btc";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import {
  getDerivationModesForCurrency,
  isSegwitDerivationMode,
  isUnsplitDerivationMode,
} from "@ledgerhq/live-common/lib/derivation";
import { getWalletName } from "@ledgerhq/live-common/lib/account";
import type {
  Account,
  CryptoCurrency,
  DerivationMode,
} from "@ledgerhq/live-common/lib/types";

import type { CurrencyBridge } from "./types";

import { open } from "../logic/hw";
import loadLibcore from "../libcore/load";
import {
  getOrCreateWallet,
  createAccountFromDevice,
  syncCoreAccount,
} from "../libcore";

// TODO env var?
const SHOW_LEGACY_NEW_ACCOUNT = false;

const shouldShowNewAccount = (currency, derivationMode) =>
  derivationMode === ""
    ? !!SHOW_LEGACY_NEW_ACCOUNT || !currency.supportsSegwit
    : derivationMode === "segwit";

const scanAccountsOnDevice = (currency, deviceId) =>
  Observable.create(o => {
    let finished = false;
    const unsubscribe = () => (finished = true);
    const isUnsubscribed = () => finished;

    async function main() {
      let transport;
      try {
        transport = await open(deviceId);
        if (isUnsubscribed()) return;

        const core = await loadLibcore();
        if (isUnsubscribed()) return;

        const derivationModes = getDerivationModesForCurrency(currency);
        for (let i = 0; i < derivationModes.length; i++) {
          const derivationMode = derivationModes[i];

          const isSegwit = isSegwitDerivationMode(derivationMode);
          const unsplitFork = isUnsplitDerivationMode(derivationMode)
            ? currency.forkedFrom
            : null;
          const { coinType } = unsplitFork
            ? getCryptoCurrencyById(unsplitFork)
            : currency;
          const path = `${isSegwit ? "49" : "44"}'/${coinType}'`;

          const hwApp = new Btc(transport);
          const { publicKey: seedIdentifier } = await hwApp.getWalletPublicKey(
            path,
            false,
            isSegwit,
          );
          if (isUnsubscribed()) return;

          const walletName = getWalletName({
            seedIdentifier,
            currency,
            derivationMode,
          });

          const wallet = await getOrCreateWallet({
            core,
            walletName,
            currency,
            derivationMode,
          });

          const accountsCount = await core.coreWallet.getAccountCount(wallet);
          const onAccountScanned = account => o.next(account);

          // recursively scan all accounts on device on the given app
          // new accounts will be created in sqlite, existing ones will be updated
          await scanNextAccount({
            core,
            wallet,
            hwApp,
            currency,
            accountsCount,
            accountIndex: 0,
            onAccountScanned,
            seedIdentifier,
            derivationMode,
            showNewAccount: shouldShowNewAccount(currency, derivationMode),
            isUnsubscribed,
          });
        }
        o.complete();
      } catch (e) {
        o.error(e);
      }

      if (transport) {
        await transport.close();
      }
    }

    main();

    return unsubscribe;
  });

async function scanNextAccount(props: {
  core: *,
  wallet: *,
  hwApp: *,
  currency: CryptoCurrency,
  accountsCount: number,
  accountIndex: number,
  onAccountScanned: Account => *,
  seedIdentifier: string,
  derivationMode: DerivationMode,
  showNewAccount: boolean,
  isUnsubscribed: () => boolean,
}) {
  const {
    core,
    wallet,
    hwApp,
    currency,
    accountsCount,
    accountIndex,
    onAccountScanned,
    seedIdentifier,
    derivationMode,
    showNewAccount,
    isUnsubscribed,
  } = props;

  // create account only if account has not been scanned yet
  // if it has already been created, we just need to get it, and sync it
  const hasBeenScanned = accountIndex < accountsCount;

  const coreAccount = hasBeenScanned
    ? await core.coreWallet.getAccount(wallet, accountIndex)
    : await createAccountFromDevice({ core, wallet, hwApp });

  if (isUnsubscribed()) return;

  const account = await syncCoreAccount({
    core,
    coreWallet: wallet,
    coreAccount,
    currencyId: currency.id,
    accountIndex,
    derivationMode,
    seedIdentifier,
  });

  if (isUnsubscribed()) return;

  const isEmpty = account.operations.length === 0;

  if (!isEmpty || showNewAccount) {
    onAccountScanned(account);
  }

  if (!isEmpty) {
    await scanNextAccount({ ...props, accountIndex: accountIndex + 1 });
  }
}

const currencyBridge: CurrencyBridge = {
  scanAccountsOnDevice,
};

export default currencyBridge;
