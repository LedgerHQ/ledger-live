// cross helps dealing with cross-project feature like export/import & cross project conversions
import { BigNumber } from "bignumber.js";
// @ts-expect-error no types for compressjs
import compressjs from "@ledgerhq/compressjs";
import type { DeviceModelId } from "@ledgerhq/devices";
import {
  runDerivationScheme,
  getDerivationScheme,
  asDerivationMode,
} from "@ledgerhq/coin-framework/derivation";
import { decodeAccountId, emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { Account, AccountUserData, CryptoCurrencyIds } from "@ledgerhq/types-live";
import { WalletState, accountUserDataExportSelector } from "../store";

export type AccountData = {
  id: string;
  currencyId: string;
  freshAddress?: string;
  seedIdentifier: string;
  derivationMode: string;
  // we are unsafe at this stage, validation is done later
  name: string;
  index: number;
  balance: string;
};

export type CryptoSettings = {
  confirmationsNb?: number;
};

export type Settings = {
  counterValue?: string;
  currenciesSettings: Record<CryptoCurrencyIds, CryptoSettings>;
  pairExchanges: Record<string, string | null | undefined>;
  blacklistedTokenIds?: string[];
  hideEmptyTokenAccounts?: boolean;
};

export type DataIn = {
  // wallet state
  walletState: WalletState;
  // accounts to export (filter them to only be the visible ones)
  accounts: Account[];
  // settings
  settings: Settings;
  // the name of the exporter. e.g. "desktop" for the desktop app
  exporterName: string;
  // the version of the exporter. e.g. the desktop app version
  exporterVersion: string;
  modelId?: DeviceModelId;
  modelIdList?: DeviceModelId[];
};

type Meta = {
  exporterName: string;
  exporterVersion: string;
  modelId?: DeviceModelId;
  modelIdList?: DeviceModelId[];
};

export type Result = {
  accounts: AccountData[];
  settings: Settings;
  meta: Meta;
};

export function encode({
  walletState,
  accounts,
  settings,
  exporterName,
  exporterVersion,
  modelId,
  modelIdList,
}: DataIn): string {
  return Buffer.from(
    compressjs.Bzip2.compressFile(
      Buffer.from(
        JSON.stringify({
          meta: {
            exporterName,
            exporterVersion,
            modelId,
            modelIdList,
          },
          accounts: accounts.map(a =>
            accountToAccountData(a, accountUserDataExportSelector(walletState, { account: a })),
          ),
          settings,
        }),
      ),
    ),
  ).toString("binary");
}

const asResultMeta = (unsafe: Record<string, unknown>): Meta => {
  if (typeof unsafe !== "object" || !unsafe) {
    throw new Error("invalid meta data");
  }

  const { exporterName, exporterVersion, modelId, modelIdList } = unsafe;

  if (typeof exporterName !== "string") {
    throw new Error("invalid meta.exporterName");
  }

  if (typeof exporterVersion !== "string") {
    throw new Error("invalid meta.exporterVersion");
  }

  let resultModelId: DeviceModelId | undefined = undefined;
  if (modelId) {
    if (typeof modelId === "string") {
      resultModelId = modelId as DeviceModelId;
    } else {
      throw new Error("invalid meta.modelId");
    }
  }

  let resultModelIdList: DeviceModelId[] | undefined = undefined;

  if (modelIdList) {
    if (
      typeof modelIdList === "object" &&
      Array.isArray(modelIdList) &&
      modelIdList.every(id => typeof id === "string")
    ) {
      resultModelIdList = modelIdList as DeviceModelId[];
    } else {
      throw new Error("invalid meta.modelIdList");
    }
  }

  return {
    exporterName,
    exporterVersion,
    modelId: resultModelId,
    modelIdList: resultModelIdList,
  };
};

const asResultAccount = (unsafe: Record<string, unknown>): AccountData => {
  if (typeof unsafe !== "object" || !unsafe) {
    throw new Error("invalid account data");
  }

  const { id, currencyId, freshAddress, seedIdentifier, derivationMode, name, index, balance } =
    unsafe;

  if (typeof id !== "string") {
    throw new Error("invalid account.id");
  }

  if (typeof currencyId !== "string") {
    throw new Error("invalid account.currencyId");
  }

  if (typeof seedIdentifier !== "string") {
    throw new Error("invalid account.seedIdentifier");
  }

  if (typeof derivationMode !== "string") {
    throw new Error("invalid account.derivationMode");
  }

  if (typeof name !== "string") {
    throw new Error("invalid account.name");
  }

  if (typeof index !== "number") {
    throw new Error("invalid account.index");
  }

  if (typeof balance !== "string") {
    throw new Error("invalid account.balance");
  }

  const o: AccountData = {
    id,
    currencyId,
    seedIdentifier,
    derivationMode,
    name,
    index,
    balance,
  };

  if (typeof freshAddress === "string" && freshAddress) {
    o.freshAddress = freshAddress;
  }

  return o;
};

const asResultAccounts = (unsafe: unknown): AccountData[] => {
  if (typeof unsafe !== "object" || !unsafe || !Array.isArray(unsafe)) {
    throw new Error("invalid accounts data");
  }

  return unsafe.map(asResultAccount);
};

const asCryptoSettings = (unsafe: Record<string, unknown>): CryptoSettings => {
  if (typeof unsafe !== "object" || !unsafe) {
    throw new Error("invalid currency settings data");
  }

  const { confirmationsNb } = unsafe;

  if (typeof confirmationsNb === "number") {
    return {
      confirmationsNb,
    };
  }

  return {};
};

const asResultSettings = (unsafe: Record<string, any>): Settings => {
  if (typeof unsafe !== "object" || !unsafe) {
    throw new Error("invalid settings data");
  }

  const {
    counterValue,
    currenciesSettings,
    pairExchanges,
    blacklistedTokenIds,
    hideEmptyTokenAccounts,
  } = unsafe;
  const currenciesSettingsSafe: Record<CryptoCurrencyIds, CryptoSettings> = {};

  if (currenciesSettings && typeof currenciesSettings === "object") {
    for (const k in currenciesSettings) {
      currenciesSettingsSafe[k] = asCryptoSettings(currenciesSettings[k]);
    }
  }

  const pairExchangesSafe: Record<string, string> = {};

  if (pairExchanges && typeof pairExchanges === "object") {
    for (const k in pairExchanges) {
      const v = pairExchanges[k];

      if (v && typeof v === "string") {
        pairExchangesSafe[k] = v;
      }
    }
  }

  const res: Settings = {
    currenciesSettings: currenciesSettingsSafe,
    pairExchanges: pairExchangesSafe,
  };

  if (counterValue && typeof counterValue === "string") {
    res.counterValue = counterValue;
  }

  if (hideEmptyTokenAccounts && typeof hideEmptyTokenAccounts === "boolean") {
    res.hideEmptyTokenAccounts = hideEmptyTokenAccounts;
  }

  const blacklistedTokenIdsSafe: string[] = [];

  if (blacklistedTokenIds && Array.isArray(blacklistedTokenIds)) {
    for (const b of blacklistedTokenIds) {
      if (typeof b === "string") {
        blacklistedTokenIdsSafe.push(b);
      }
    }

    res.blacklistedTokenIds = blacklistedTokenIdsSafe;
  }

  return res;
};

export function decode(bytes: string): Result {
  const unsafe: Record<string, any> = JSON.parse(
    Buffer.from(compressjs.Bzip2.decompressFile(Buffer.from(bytes, "binary"))).toString(),
  );

  if (typeof unsafe !== "object" || !unsafe) {
    throw new Error("invalid data");
  }

  return {
    meta: asResultMeta(unsafe.meta),
    accounts: asResultAccounts(unsafe.accounts),
    settings: asResultSettings(unsafe.settings),
  };
}
export function accountToAccountData(
  { id, seedIdentifier, derivationMode, freshAddress, currency, index, balance }: Account,
  { name }: AccountUserData,
): AccountData {
  const res: AccountData = {
    id,
    name,
    seedIdentifier,
    derivationMode,
    freshAddress,
    currencyId: currency.id,
    index,
    balance: balance.toString(),
  };

  return res;
}
// reverse the account data to an account.
// this restore the essential data of an account and the result of the fields
// are assumed to be restored during first sync
export const accountDataToAccount = ({
  id,
  currencyId,
  freshAddress: inputFreshAddress,
  name,
  index,
  balance,
  derivationMode: derivationModeStr,
  seedIdentifier,
}: AccountData): [Account, AccountUserData] => {
  const { xpubOrAddress } = decodeAccountId(id); // TODO rename in AccountId xpubOrAddress

  const derivationMode = asDerivationMode(derivationModeStr);
  const currency = getCryptoCurrencyById(currencyId);
  let xpub = "";
  let freshAddress = inputFreshAddress || "";
  let freshAddressPath = "";

  if (
    // FIXME Dirty hack, since we have no way here to know if "xpubOrAddress" is one or the other.
    // Proposed fix: https://ledgerhq.atlassian.net/browse/LL-7437
    currency.family === "bitcoin" ||
    currency.family === "cardano"
  ) {
    // In bitcoin implementation, xpubOrAddress field always go in the xpub
    xpub = xpubOrAddress;
  } else {
    if (currency.family === "tezos" || currency.family === "stacks") {
      xpub = xpubOrAddress;
    } else if (!freshAddress) {
      // otherwise, it's the freshAddress
      freshAddress = xpubOrAddress;
    }

    freshAddressPath = runDerivationScheme(
      getDerivationScheme({
        currency,
        derivationMode,
      }),
      currency,
      {
        account: index,
      },
    );
  }

  const balanceBN = new BigNumber(balance);
  const account: Account = {
    type: "Account",
    id,
    derivationMode,
    seedIdentifier,
    xpub,
    used: false,
    currency,
    index,
    freshAddress,
    freshAddressPath,
    swapHistory: [],
    blockHeight: 0,
    balance: balanceBN,
    spendableBalance: balanceBN,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(0),
    creationDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
  };

  const accountUserData: AccountUserData = {
    id,
    name,
    starredIds: [],
  };

  return [account, accountUserData];
};
