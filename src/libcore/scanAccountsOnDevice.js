// @flow

import { Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { getCryptoCurrencyById } from "../currencies";
import {
  getDerivationModesForCurrency,
  isUnsplitDerivationMode,
  getPurposeDerivationMode
} from "../derivation";
import { getWalletName, shouldShowNewAccount } from "../account";
import type { Account, CryptoCurrency, DerivationMode } from "../types";
import { log } from "../logs";
import { open } from "../hw";
import getAddress from "../hw/getAddress";
import { withLibcoreF } from "./access";
import { syncCoreAccount } from "./syncAccount";
import { getOrCreateWallet } from "./getOrCreateWallet";
import { createAccountFromDevice } from "./createAccountFromDevice";
import { remapLibcoreErrors } from "./errors";
import type { Core, CoreWallet } from "./types";

async function scanNextAccount(props: {
  core: Core,
  wallet: CoreWallet,
  transport: Transport<*>,
  currency: CryptoCurrency,
  accountIndex: number,
  onAccountScanned: Account => *,
  seedIdentifier: string,
  derivationMode: DerivationMode,
  showNewAccount: boolean,
  isUnsubscribed: () => boolean
}) {
  const {
    core,
    wallet,
    transport,
    currency,
    accountIndex,
    onAccountScanned,
    seedIdentifier,
    derivationMode,
    showNewAccount,
    isUnsubscribed
  } = props;

  let coreAccount;
  try {
    coreAccount = await wallet.getAccount(accountIndex);
  } catch (err) {
    coreAccount = await createAccountFromDevice({
      core,
      wallet,
      transport,
      currency,
      index: accountIndex,
      derivationMode
    });
  }

  if (isUnsubscribed()) return;

  const account = await syncCoreAccount({
    core,
    coreWallet: wallet,
    coreAccount,
    currency,
    accountIndex,
    derivationMode,
    seedIdentifier
  });

  if (isUnsubscribed()) return;

  const isEmpty = account.operations.length === 0;
  const shouldSkip = isEmpty && !showNewAccount;

  log(
    "libcore",
    `scanning ${currency.id} ${derivationMode ||
      "default"}@${accountIndex}: resulted of ${
      account && !shouldSkip
        ? `Account with ${account.operations.length} txs (xpub ${String(
            account.xpub
          )}, fresh ${account.freshAddressPath} ${account.freshAddress})`
        : "no account"
    }. ${isEmpty ? "ALL SCANNED" : ""}`
  );

  if (!shouldSkip) {
    onAccountScanned(account);
  }

  if (!isEmpty) {
    await scanNextAccount({ ...props, accountIndex: accountIndex + 1 });
  }
}

export const scanAccountsOnDevice = (
  currency: CryptoCurrency,
  deviceId: string,
  filterDerivationMode?: DerivationMode => boolean
): Observable<Account> =>
  Observable.create(o => {
    let finished = false;
    const unsubscribe = () => {
      finished = true;
    };
    const isUnsubscribed = () => finished;

    const main = withLibcoreF(core => async () => {
      let transport;
      try {
        transport = await open(deviceId);
        if (isUnsubscribed()) return;

        let derivationModes = getDerivationModesForCurrency(currency);
        if (filterDerivationMode) {
          derivationModes = derivationModes.filter(filterDerivationMode);
        }
        for (let i = 0; i < derivationModes.length; i++) {
          const derivationMode = derivationModes[i];

          const unsplitFork = isUnsplitDerivationMode(derivationMode)
            ? currency.forkedFrom
            : null;
          const purpose = getPurposeDerivationMode(derivationMode);
          const { coinType } = unsplitFork
            ? getCryptoCurrencyById(unsplitFork)
            : currency;
          const path = `${purpose}'/${coinType}'`;

          const { publicKey: seedIdentifier } = await getAddress(transport, {
            currency,
            path,
            derivationMode
          });

          if (isUnsubscribed()) return;

          const walletName = getWalletName({
            seedIdentifier,
            currency,
            derivationMode
          });

          const wallet = await getOrCreateWallet({
            core,
            walletName,
            currency,
            derivationMode
          });

          const onAccountScanned = account => o.next(account);

          // recursively scan all accounts on device on the given app
          // new accounts will be created in sqlite, existing ones will be updated
          await scanNextAccount({
            core,
            wallet,
            transport,
            currency,
            accountIndex: 0,
            onAccountScanned,
            seedIdentifier,
            derivationMode,
            showNewAccount: shouldShowNewAccount(currency, derivationMode),
            isUnsubscribed
          });
        }
        o.complete();
      } catch (e) {
        o.error(remapLibcoreErrors(e));
      }

      if (transport) {
        await transport.close();
      }
    });

    main();

    return unsubscribe;
  });
