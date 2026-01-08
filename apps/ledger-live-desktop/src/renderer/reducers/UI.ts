import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { State } from "~/renderer/reducers";
import { Data as CompleteExchangeData } from "~/renderer/modals/Platform/Exchange/CompleteExchange/Body";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

export type PlatformAppDrawerInfo = {
  type: "DAPP_INFO";
  manifest?: LiveAppManifest | null;
  title: string;
};

export type PlatformAppDrawerDisclaimer = {
  type: "DAPP_DISCLAIMER";
  manifest?: LiveAppManifest | null;
  title: string | null;
  disclaimerId: string;
  next: (manifest: AppManifest, isChecked: boolean) => void;
};

export type StartExchangeAppDrawer = {
  type: "EXCHANGE_START";
  title: string;
  data: {
    exchangeType: ExchangeType;
    provider?: string;
    fromAccountId?: string;
    toAccountId?: string;
    tokenCurrency?: string;
    onResult: (result: { nonce: string; device: Device }) => void;
    onCancel: (cancelResult: { error: Error; device: Device }) => void;
  };
};

export type CompleteExchangeAppDrawer = {
  type: "EXCHANGE_COMPLETE";
  title: string;
  data: CompleteExchangeData;
};

export type ExchangeAppDrawer = StartExchangeAppDrawer | CompleteExchangeAppDrawer;

export type PlatformAppDrawers = PlatformAppDrawerInfo | PlatformAppDrawerDisclaimer;

export type UIState = {
  informationCenter: {
    isOpen: boolean;
    tabId?: string;
  };
  platformAppDrawer: {
    isOpen: boolean;
    payload?: PlatformAppDrawers | ExchangeAppDrawer | null;
  };
  isMemoTagBoxVisible: boolean;
  forceAutoFocusOnMemoField: boolean;
};

const initialState: UIState = {
  informationCenter: {
    isOpen: false,
    tabId: "announcement",
  },
  platformAppDrawer: {
    isOpen: false,
    payload: undefined,
  },
  isMemoTagBoxVisible: false,
  forceAutoFocusOnMemoField: false,
};

const uiSlice = createSlice({
  name: "UI",
  initialState,
  reducers: {
    openInformationCenter: (state, action: PayloadAction<{ tabId?: string }>) => {
      state.informationCenter.isOpen = true;
      state.informationCenter.tabId = action.payload.tabId || "announcement";
    },
    setTabInformationCenter: (state, action: PayloadAction<{ tabId: string }>) => {
      state.informationCenter.tabId = action.payload.tabId;
    },
    closeInformationCenter: state => {
      state.informationCenter.isOpen = false;
    },
    openPlatformAppInfoDrawer: (
      state,
      action: PayloadAction<{ manifest: LiveAppManifest | undefined | null }>,
    ) => {
      return {
        ...state,
        platformAppDrawer: {
          isOpen: true,
          payload: {
            type: "DAPP_INFO",
            title: "platform.app.informations.title",
            manifest: action.payload.manifest,
          },
        },
      };
    },
    openPlatformAppDisclaimerDrawer: (
      state,
      action: PayloadAction<{
        manifest: LiveAppManifest | undefined | null;
        disclaimerId: string;
        next: (manifest: AppManifest, isChecked: boolean) => void;
      }>,
    ) => {
      return {
        ...state,
        platformAppDrawer: {
          isOpen: true,
          payload: {
            type: "DAPP_DISCLAIMER",
            manifest: action.payload.manifest,
            title: null,
            disclaimerId: action.payload.disclaimerId,
            next: action.payload.next,
          },
        },
      };
    },
    openExchangeDrawer: (
      state,
      action: PayloadAction<
        | {
            type: "EXCHANGE_START";
            exchangeType: ExchangeType;
            provider?: string;
            fromAccountId?: string;
            toAccountId?: string;
            tokenCurrency?: string;
            onResult: (result: { nonce: string; device: Device }) => void;
            onCancel: (cancelResult: { error: Error; device: Device }) => void;
          }
        | ({
            type: "EXCHANGE_COMPLETE";
          } & CompleteExchangeData)
      >,
    ) => {
      const { type, ...data } = action.payload;
      return {
        ...state,
        platformAppDrawer: {
          isOpen: true,
          payload: {
            type,
            title: "swap2.exchangeDrawer.title",
            data,
          } as ExchangeAppDrawer,
        },
      };
    },
    closePlatformAppDrawer: state => {
      state.platformAppDrawer.isOpen = false;
    },
    setMemoTagInfoBoxDisplay: (
      state,
      action: PayloadAction<{
        isMemoTagBoxVisible: boolean;
        forceAutoFocusOnMemoField?: boolean;
      }>,
    ) => {
      state.isMemoTagBoxVisible = action.payload.isMemoTagBoxVisible;
      state.forceAutoFocusOnMemoField = !!action.payload?.forceAutoFocusOnMemoField;
    },
  },
});

export const {
  openInformationCenter,
  setTabInformationCenter,
  closeInformationCenter,
  openPlatformAppInfoDrawer,
  openPlatformAppDisclaimerDrawer,
  openExchangeDrawer,
  closePlatformAppDrawer,
  setMemoTagInfoBoxDisplay,
} = uiSlice.actions;

export const informationCenterStateSelector = (state: State): UIState["informationCenter"] =>
  state.UI.informationCenter;
export const platformAppDrawerStateSelector = (state: State): UIState["platformAppDrawer"] =>
  state.UI.platformAppDrawer;
export const memoTagBoxVisibilitySelector = (state: State): UIState["isMemoTagBoxVisible"] =>
  state.UI.isMemoTagBoxVisible;
export const forceAutoFocusOnMemoFieldSelector = (
  state: State,
): UIState["forceAutoFocusOnMemoField"] => state.UI.forceAutoFocusOnMemoField;

export default uiSlice.reducer;
