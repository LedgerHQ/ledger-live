import type { RefObject } from "react";
import type {
  Account,
  AccountLike,
  AnyMessage,
  Operation,
  SignedOperation,
} from "@ledgerhq/types-live";
import type { WalletHandlers, ServerConfig } from "@ledgerhq/wallet-api-server";
import type { WalletState } from "@ledgerhq/live-wallet/store";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { Subject } from "rxjs";
import type { StateDB } from "../../hooks/useDBRaw";
import type { AppManifest, WalletAPICustomHandlers, DiscoverDB } from "../types";
import type { CompleteExchangeUiRequest } from "../logic/exchange";
import type { ModularDrawerConfiguration } from "../ModularDrawer/types";
import type { AppResult } from "../../hw/actions/app";
import type { Transaction } from "../../generated/types";
import type { LiveAppManifest } from "../../platform/types";
import type { TrackingAPI } from "../tracking";
import type { BidirectionalEvent } from "../../hw/openTransportAsSubject";

export interface UiHook {
  "account.request": (params: {
    currencyIds?: string[];
    areCurrenciesFiltered?: boolean;
    useCase?: string;
    uiUseCase?: string;
    drawerConfiguration?: ModularDrawerConfiguration;
    onSuccess: (account: AccountLike, parentAccount: Account | undefined) => void;
    onCancel: () => void;
  }) => void;
  "account.receive": (params: {
    account: AccountLike;
    parentAccount: Account | undefined;
    accountAddress: string;
    onSuccess: (address: string) => void;
    onCancel: () => void;
    onError: (error: Error) => void;
  }) => void;
  "message.sign": (params: {
    account: AccountLike;
    message: AnyMessage;
    options: Parameters<WalletHandlers["message.sign"]>[0]["options"];
    onSuccess: (signature: string) => void;
    onError: (error: Error) => void;
    onCancel: () => void;
  }) => void;
  "storage.get": WalletHandlers["storage.get"];
  "storage.set": WalletHandlers["storage.set"];
  "transaction.signRaw": (params: {
    account: AccountLike;
    parentAccount: Account | undefined;
    transaction: string;
    broadcast?: boolean;
    options: Parameters<WalletHandlers["transaction.sign"]>[0]["options"];
    onSuccess: (signedOperation: SignedOperation) => void;
    onError: (error: Error) => void;
  }) => void;
  "transaction.sign": (params: {
    account: AccountLike;
    parentAccount: Account | undefined;
    signFlowInfos: {
      canEditFees: boolean;
      hasFeesProvided: boolean;
      liveTx: Partial<Transaction>;
    };
    options: Parameters<WalletHandlers["transaction.sign"]>[0]["options"];
    onSuccess: (signedOperation: SignedOperation) => void;
    onError: (error: Error) => void;
  }) => void;
  "transaction.broadcast": (
    account: AccountLike,
    parentAccount: Account | undefined,
    mainAccount: Account,
    optimisticOperation: Operation,
  ) => void;
  "device.transport": (params: {
    appName: string | undefined;
    onSuccess: (result: AppResult) => void;
    onCancel: () => void;
  }) => void;
  "device.select": (params: {
    appName: string | undefined;
    onSuccess: (result: AppResult) => void;
    onCancel: () => void;
  }) => void;
  "exchange.start": (params: {
    exchangeType: "SWAP" | "FUND" | "SELL" | "SWAP_NG" | "SELL_NG" | "FUND_NG";
    onSuccess: (nonce: string) => void;
    onCancel: (error: Error) => void;
  }) => void;
  "exchange.complete": (params: {
    exchangeParams: CompleteExchangeUiRequest;
    onSuccess: (hash: string) => void;
    onCancel: (error: Error) => void;
  }) => void;
}

export enum ExchangeType {
  SWAP = 0x00,
  SELL = 0x01,
  FUND = 0x02,
  SWAP_NG = 0x03,
  SELL_NG = 0x04,
  FUND_NG = 0x05,
}

export type RecentlyUsedDB = StateDB<DiscoverDB, DiscoverDB["recentlyUsed"]>;
export type CacheBustedLiveAppsdDB = StateDB<DiscoverDB, DiscoverDB["cacheBustedLiveApps"]>;
export type LocalLiveAppDB = StateDB<DiscoverDB, DiscoverDB["localLiveApp"]>;
export type CurrentAccountHistDB = StateDB<DiscoverDB, DiscoverDB["currentAccountHist"]>;

export interface Categories {
  categories: string[];
  manifestsByCategories: Map<string, AppManifest[]>;
  selected: string;
  setSelected: (val: string) => void;
  reset: () => void;
}

export type CategoryId = Categories["selected"];

export interface LocalLiveApp {
  state: LiveAppManifest[];
  addLocalManifest: (LiveAppManifest) => void;
  removeLocalManifestById: (string) => void;
  getLocalLiveAppManifestById: (string) => LiveAppManifest | undefined;
}

export interface RecentlyUsed {
  data: RecentlyUsedManifest[];
  append: (manifest: AppManifest) => void;
  clear: () => void;
}

export type RecentlyUsedManifest = AppManifest & { usedAt: UsedAt };
export type UsedAt = {
  unit?: Intl.RelativeTimeFormatUnit;
  diff: number;
};

export interface DisclaimerRaw {
  onConfirm: (manifest: AppManifest, isChecked: boolean) => void;
  onSelect: (manifest: AppManifest) => void;
}

export type useWalletAPIServerOptions = {
  walletState: WalletState;
  manifest: AppManifest;
  accounts: AccountLike[];
  tracking: TrackingAPI;
  config: ServerConfig;
  webviewHook: {
    reload: () => void;
    postMessage: (message: string) => void;
  };
  uiHook: Partial<UiHook>;
  customHandlers?: WalletAPICustomHandlers;
};

export interface DeviceTransport {
  ref: RefObject<Subject<BidirectionalEvent> | undefined>;
  subscribe: (deviceId: string) => void;
  close: () => void;
  exchange: WalletHandlers["device.exchange"];
}

export interface HandlerDeps {
  walletState: WalletState;
  manifest: AppManifest;
  accounts: AccountLike[];
  tracking: TrackingAPI;
  config: ServerConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: ThunkDispatch<any, any, UnknownAction>;
  deactivatedCurrencyIds: Set<string>;
  webviewReload: () => void;
  uiAccountRequest?: UiHook["account.request"];
  uiAccountReceive?: UiHook["account.receive"];
  uiMessageSign?: UiHook["message.sign"];
  uiStorageGet?: UiHook["storage.get"];
  uiStorageSet?: UiHook["storage.set"];
  uiTxSign?: UiHook["transaction.sign"];
  uiTxSignRaw?: UiHook["transaction.signRaw"];
  uiTxBroadcast?: UiHook["transaction.broadcast"];
  uiDeviceTransport?: UiHook["device.transport"];
  uiDeviceSelect?: UiHook["device.select"];
  uiExchangeStart?: UiHook["exchange.start"];
  uiExchangeComplete?: UiHook["exchange.complete"];
  device: DeviceTransport;
}
