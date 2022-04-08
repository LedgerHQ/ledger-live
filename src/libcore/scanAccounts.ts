import { Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";
import { TransportStatusError, UserRefusedAddress } from "@ledgerhq/errors";
import semver from "semver";
import {
  getDerivationModesForCurrency,
  getSeedIdentifierDerivation,
  derivationModeSupportsIndex,
  isIterableDerivationMode,
  getMandatoryEmptyAccountSkip,
  getDerivationModeStartsAt,
} from "../derivation";
import { getWalletName, shouldShowNewAccount } from "../account";
import type {
  Account,
  CryptoCurrency,
  DerivationMode,
  ScanAccountEvent,
  SyncConfig,
} from "../types";
import { withDevice } from "../hw/deviceAccess";
import getAddress from "../hw/getAddress";
import getAppAndVersion from "../hw/getAppAndVersion";
import { withLibcoreF } from "./access";
import { syncCoreAccount, newSyncLogId } from "./syncAccount";
import { getOrCreateWallet } from "./getOrCreateWallet";
import {
  DerivationsCache,
  createAccountFromDevice,
} from "./createAccountFromDevice";
import { remapLibcoreErrors, isNonExistingAccountError } from "./errors";
import { GetAppAndVersionUnsupportedFormat } from "../errors";
import nativeSegwitAppsVersionsMap from "./nativeSegwitAppsVersionsMap";
import type { Core, CoreWallet } from "./types";
import { GetAddressOptions, Result } from "../hw/getAddress/types";

async function scanNextAccount(props: {
  core: Core;
  wallet: CoreWallet;
  currency: CryptoCurrency;
  accountIndex: number;
  onAccountScanned: (arg0: Account) => any;
  seedIdentifier: string;
  derivationMode: DerivationMode;
  showNewAccount: boolean;
  isUnsubscribed: () => boolean;
  emptyCount?: number;
  syncConfig: SyncConfig;
  derivationsCache: DerivationsCache;
  getAddr: (opts: GetAddressOptions) => Promise<Result>;
}) {
  const logId = newSyncLogId();
  const {
    core,
    wallet,
    currency,
    accountIndex,
    onAccountScanned,
    seedIdentifier,
    derivationMode,
    showNewAccount,
    isUnsubscribed,
    syncConfig,
    derivationsCache,
    getAddr,
  } = props;
  log(
    "libcore",
    `sync(${logId}) scanNextAccount started. ${currency.id}|${derivationMode}|${accountIndex}`
  );
  let coreAccount;

  try {
    coreAccount = await wallet.getAccount(accountIndex);
  } catch (err: any) {
    if (!isNonExistingAccountError(err)) {
      throw err;
    }

    if (isUnsubscribed()) return;
    coreAccount = await createAccountFromDevice({
      core,
      wallet,
      currency,
      index: accountIndex,
      derivationMode,
      isUnsubscribed,
      derivationsCache,
      getAddress: getAddr,
    });
  }

  if (isUnsubscribed() || !coreAccount) return;
  const account = await syncCoreAccount({
    core,
    coreWallet: wallet,
    coreAccount,
    currency,
    accountIndex,
    derivationMode,
    seedIdentifier,
    logId,
    syncConfig,
  });
  if (isUnsubscribed()) return;
  const shouldSkip =
    accountIndex < getDerivationModeStartsAt(derivationMode) ||
    (!account.used && !showNewAccount) ||
    !derivationModeSupportsIndex(derivationMode, accountIndex);
  log(
    "libcore",
    `scanning ${currency.id} ${
      derivationMode || "default"
    }@${accountIndex}: resulted of ${
      account && !shouldSkip
        ? `Account with ${account.operationsCount} txs (xpub ${String(
            account.xpub
          )}, fresh ${account.freshAddressPath} ${account.freshAddress})`
        : "no account"
    }. ${!account.used ? "ALL SCANNED" : ""}`
  );

  if (!shouldSkip) {
    onAccountScanned(account);
  }

  const emptyCount = props.emptyCount || 0;
  const shouldIter = !account.used
    ? emptyCount < getMandatoryEmptyAccountSkip(derivationMode)
    : isIterableDerivationMode(derivationMode);

  if (shouldIter) {
    await scanNextAccount({
      ...props,
      accountIndex: accountIndex + 1,
      emptyCount: !account.used ? emptyCount + 1 : 0,
    });
  }
}

const libcoreBlacklist = ["taproot"];

export const scanAccounts = ({
  currency,
  deviceId,
  scheme,
  syncConfig,
  getAddressFn,
}: {
  currency: CryptoCurrency;
  deviceId: string;
  scheme?: DerivationMode | null | undefined;
  syncConfig: SyncConfig;
  getAddressFn?: (
    transport: Transport
  ) => (opts: GetAddressOptions) => Promise<Result>;
}): Observable<ScanAccountEvent> =>
  withDevice(deviceId)((transport) =>
    Observable.create((o) => {
      let finished = false;

      const unsubscribe = () => {
        finished = true;
      };

      const isUnsubscribed = () => finished;

      const main = withLibcoreF((core) => async () => {
        try {
          let derivationModes = getDerivationModesForCurrency(currency);

          if (scheme !== undefined) {
            derivationModes = derivationModes.filter((mode) => mode === scheme);
          }

          derivationModes = derivationModes.filter(
            (m) => !libcoreBlacklist.includes(m)
          );

          for (let i = 0; i < derivationModes.length; i++) {
            const derivationMode = derivationModes[i];
            const path = getSeedIdentifierDerivation(currency, derivationMode);
            let result;

            if (derivationMode === "native_segwit") {
              if (nativeSegwitAppsVersionsMap[currency.managerAppName]) {
                try {
                  const { version } = await getAppAndVersion(transport);

                  if (
                    !semver.gte(
                      version,
                      nativeSegwitAppsVersionsMap[currency.managerAppName]
                    )
                  ) {
                    continue;
                  }
                } catch (e) {
                  // in case the apdu is not even supported, we assume to not do native_segwit
                  if (
                    (e instanceof TransportStatusError &&
                      // @ts-expect-error TransportStatusError to be typed on ledgerjs
                      e.statusCode === 0x6d00) ||
                    e instanceof GetAppAndVersionUnsupportedFormat
                  ) {
                    continue;
                  }

                  throw e;
                }
              }
            }

            const getAddr = getAddressFn
              ? getAddressFn(transport)
              : (opts) => getAddress(transport, opts);

            try {
              result = await getAddr({ currency, path, derivationMode });
            } catch (e) {
              // feature detection: some old app will specifically returns this code for segwit case and we ignore it
              // we also feature detect any denying case that could happen
              if (
                e instanceof TransportStatusError ||
                e instanceof UserRefusedAddress
              ) {
                log("scanAccounts", "ignore derivationMode=" + derivationMode);
              }
            }

            if (!result) continue;
            const seedIdentifier = result.publicKey;
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
            if (isUnsubscribed()) return;

            const onAccountScanned = (account) =>
              o.next({
                type: "discovered",
                account,
              });

            // recursively scan all accounts on device on the given app
            // new accounts will be created in sqlite, existing ones will be updated
            await scanNextAccount({
              core,
              wallet,
              currency,
              accountIndex: 0,
              onAccountScanned,
              seedIdentifier,
              derivationMode,
              showNewAccount: shouldShowNewAccount(currency, derivationMode),
              isUnsubscribed,
              syncConfig,
              derivationsCache: new DerivationsCache(),
              getAddr,
            });
          }

          o.complete();
        } catch (e) {
          o.error(remapLibcoreErrors(e));
        }
      });
      main();
      return unsubscribe;
    })
  );
