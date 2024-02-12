import { handleActions } from "redux-actions";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { State } from "~/renderer/reducers";
import { Handlers } from "./types";
import { Data as CompleteExchangeData } from "~/renderer/modals/Platform/Exchange/CompleteExchange/Body";

export type PlatformAppDrawerInfo = {
  type: "DAPP_INFO";
  manifest?: LiveAppManifest | null;
  title: string;
};

export type PlatformAppDrawerDisclaimer = {
  type: "DAPP_DISCLAIMER";
  manifest?: LiveAppManifest | null;
  title: string;
  next: () => void;
};

export type StartExchangeAppDrawer = {
  type: "EXCHANGE_START";
  title: string;
  data: {
    exchangeType: number;
    onResult: () => void;
    onCancel: () => void;
  };
};

export type CompleteExchangeAppDrawer = {
  type: "EXCHANGE_COMPLETED";
  title: string;
  data: CompleteExchangeData;
};

export type ExchangeAppDrawer = CompleteExchangeAppDrawer & StartExchangeAppDrawer;

export type PlatformAppDrawers = PlatformAppDrawerInfo & PlatformAppDrawerDisclaimer;

export type UIState = {
  informationCenter: {
    isOpen: boolean;
    tabId?: string;
  };
  platformAppDrawer: {
    isOpen: boolean;
    payload?: PlatformAppDrawers | null;
  };
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
};

type OpenPayload = {
  tabId?: string;
};

type HandlersPayloads = {
  INFORMATION_CENTER_OPEN: OpenPayload;
  INFORMATION_CENTER_SET_TAB: OpenPayload;
  INFORMATION_CENTER_CLOSE: never;
  PLATFORM_APP_DRAWER_OPEN: PlatformAppDrawers;
  PLATFORM_APP_DRAWER_CLOSE: never;
  EXCHANGE_APP_DRAWER_OPEN: ExchangeAppDrawer;
};
type UIHandlers<PreciseKey = true> = Handlers<UIState, HandlersPayloads, PreciseKey>;

const handlers: UIHandlers = {
  INFORMATION_CENTER_OPEN: (state, { payload }) => {
    const { tabId } = payload;
    return {
      ...state,
      informationCenter: {
        ...state.informationCenter,
        isOpen: true,
        tabId: tabId || "announcement",
      },
    };
  },
  INFORMATION_CENTER_SET_TAB: (state, { payload }) => {
    const { tabId } = payload;
    return {
      ...state,
      informationCenter: {
        ...state.informationCenter,
        tabId: tabId,
      },
    };
  },
  INFORMATION_CENTER_CLOSE: state => {
    return {
      ...state,
      informationCenter: {
        ...state.informationCenter,
        isOpen: false,
      },
    };
  },
  PLATFORM_APP_DRAWER_OPEN: (state, { payload }) => {
    return {
      ...state,
      platformAppDrawer: {
        isOpen: true,
        payload,
      },
    };
  },
  PLATFORM_APP_DRAWER_CLOSE: state => {
    return {
      ...state,
      platformAppDrawer: {
        ...state.platformAppDrawer,
        isOpen: false,
      },
    };
  },
  EXCHANGE_APP_DRAWER_OPEN: (state, { payload }) => {
    return {
      ...state,
      platformAppDrawer: {
        isOpen: true,
        payload,
      },
    };
  },
};

// Selectors

export const UIStateSelector = (state: State): UIState => state.UI;
export const informationCenterStateSelector = (state: State): UIState["informationCenter"] =>
  state.UI.informationCenter;
export const platformAppDrawerStateSelector = (state: State): UIState["platformAppDrawer"] =>
  state.UI.platformAppDrawer;

// Exporting reducer

export default handleActions<UIState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as UIHandlers<false>,
  initialState,
);
