import React from "react";
import { render, waitFor, act, screen } from "@tests/test-renderer";
import {
  ModularDrawerSharedNavigator,
  WITHOUT_ACCOUNT_SELECTION,
  WITH_ACCOUNT_SELECTION,
  mockedFF,
  mockedAccounts,
  ARB_ACCOUNT,
} from "./shared";
import { State } from "~/reducers/types";
import { INITIAL_STATE } from "~/reducers/settings";

import { http, HttpResponse } from "msw";
import { server } from "@tests/server";
import {
  NetInfoStateType,
  useNetInfo,
  type NetInfoState,
  type NetInfoNoConnectionState,
  type NetInfoUnknownState,
} from "@react-native-community/netinfo";

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockUseAcceptedCurrency(),
}));

const mockUseAcceptedCurrency = jest.fn(() => () => true);

// Use global netinfo mock from jest-setup - do not replace to avoid mock cannibalization
type NetInfoOverride =
  | ({
      type: NetInfoStateType.none;
    } & Partial<Omit<NetInfoNoConnectionState, "type">>)
  | ({
      type?: NetInfoStateType.unknown;
    } & Partial<Omit<NetInfoUnknownState, "type">>);

const buildNetInfoState = (override?: NetInfoOverride): NetInfoState => {
  if (override?.type === NetInfoStateType.none) {
    const noConnectionBase: NetInfoNoConnectionState = {
      type: NetInfoStateType.none,
      isConnected: false,
      isInternetReachable: false,
      details: null,
    };

    return {
      ...noConnectionBase,
      ...override,
    };
  }

  const unknownBase: NetInfoUnknownState = {
    type: NetInfoStateType.unknown,
    isConnected: null,
    isInternetReachable: null,
    details: null,
  };

  return {
    ...unknownBase,
    ...override,
  };
};

const setNetInfoState = (override?: NetInfoOverride) => {
  jest.mocked(useNetInfo).mockReturnValue(buildNetInfoState(override));
};

const advanceTimers = () => {
  act(() => {
    jest.advanceTimersByTime(500);
  });
};

type DrawerVariant = {
  label: string;
  backButtonTestId: string;
  renderOptions: Parameters<typeof render>[1];
};

const DRAWER_VARIANTS: DrawerVariant[] = [
  {
    label: "Gorhom (legacy)",
    backButtonTestId: "drawer-back-button",
    renderOptions: undefined,
  },
  {
    label: "Lumen BottomSheet (lwmWallet40)",
    backButtonTestId: "bottom-sheet-header-back-button",
    renderOptions: {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          overriddenFeatureFlags: {
            ...mockedFF,
            lwmWallet40: { enabled: true },
          },
        },
      }),
    },
  },
];

describe.each(DRAWER_VARIANTS)(
  "ModularDrawer integration [$label]",
  ({ backButtonTestId, renderOptions }) => {
    beforeEach(() => {
      jest.clearAllMocks();
      setNetInfoState();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should allow full navigation: asset → network → Device Selection, with back navigation at each step", async () => {
      const { getByText, getByTestId, user } = render(
        <ModularDrawerSharedNavigator />,
        renderOptions,
      );

      await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
      advanceTimers();

      await user.press(getByText(/ethereum/i));
      advanceTimers();

      expect(getByText(/select network/i)).toBeVisible();
      advanceTimers();

      await user.press(getByTestId(backButtonTestId));
      advanceTimers();

      expect(getByText(/select asset/i)).toBeVisible();

      await user.press(getByText(/ethereum/i));
      advanceTimers();

      expect(getByText(/select network/i)).toBeVisible();

      await user.press(getByText(/arbitrum/i));
      advanceTimers();

      expect(getByText(/Connect Device/i)).toBeVisible();
    });

    it("should go directly to Device selection for Bitcoin", async () => {
      const { getByText, user } = render(<ModularDrawerSharedNavigator />, renderOptions);

      await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
      advanceTimers();

      await user.press(getByText(/bitcoin/i));
      advanceTimers();

      expect(getByText(/Connect Device/i)).toBeVisible();
    });

    it("should allow searching for assets", async () => {
      const { getByText, queryByText, getByPlaceholderText, user } = render(
        <ModularDrawerSharedNavigator />,
        renderOptions,
      );

      await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
      advanceTimers();

      expect(getByText(/bitcoin/i)).toBeVisible();

      const searchInput = getByPlaceholderText(/search/i);
      await user.type(searchInput, "bitc");

      await waitFor(() => expect(queryByText(/ethereum/i)).not.toBeVisible());
      await waitFor(() => expect(getByText(/bitcoin/i)).toBeVisible());
    });

    it("should show the empty state when no assets are found", async () => {
      const { getByText, queryByText, getByPlaceholderText, user } = render(
        <ModularDrawerSharedNavigator />,
        renderOptions,
      );

      await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
      advanceTimers();

      await user.type(getByPlaceholderText(/search/i), "ttttttt");

      await waitFor(() => expect(queryByText(/no assets found/i)).toBeVisible());
    });

    it("should not crash when tapping search input with empty asset list", async () => {
      const { getByText, getByPlaceholderText, getByTestId, user } = render(
        <ModularDrawerSharedNavigator />,
        renderOptions,
      );

      await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
      advanceTimers();

      const searchInput = getByPlaceholderText(/search/i);
      await user.type(searchInput, "zzzzzzz");

      await waitFor(() => expect(getByText(/no assets found/i)).toBeVisible());

      await user.press(searchInput);
      advanceTimers();

      expect(getByTestId("modular-drawer-search-input")).toBeVisible();
      expect(getByText(/no assets found/i)).toBeVisible();
    });

    it("should expand to full height when tapping search input with non-empty list", async () => {
      const { getByText, getByPlaceholderText, user } = render(
        <ModularDrawerSharedNavigator />,
        renderOptions,
      );

      await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
      advanceTimers();

      await waitFor(() => expect(getByText(/bitcoin/i)).toBeVisible());

      const searchInput = getByPlaceholderText(/search/i);
      await user.press(searchInput);
      advanceTimers();

      expect(searchInput).toBeVisible();
    });

    it("should allow full navigation: asset → network → account", async () => {
      const { getByText, user } = render(<ModularDrawerSharedNavigator />, {
        ...INITIAL_STATE,
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: { active: mockedAccounts },
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              ...mockedFF,
              ...(renderOptions?.overrideInitialState
                ? { lwmWallet40: { enabled: true } }
                : undefined),
            },
          },
          wallet: {
            ...state.wallet,
            accountNames: new Map([[ARB_ACCOUNT.id, "Arbitrum One"]]),
          },
        }),
      });

      await user.press(getByText(WITH_ACCOUNT_SELECTION));
      advanceTimers();

      await waitFor(() => expect(getByText(/select asset/i)).toBeVisible());

      await user.press(getByText(/ethereum/i));
      advanceTimers();

      expect(getByText(/select network/i)).toBeVisible();

      await user.press(getByText(/arbitrum/i));
      advanceTimers();

      expect(getByText(/select account/i)).toBeVisible();
      expect(getByText(/Arbitrum One/i)).toBeVisible();
      expect(getByText(/add new or existing account/i)).toBeVisible();

      await user.press(getByText(/add new or existing account/i));
      advanceTimers();

      expect(getByText(/Connect Device/i)).toBeVisible();
    });

    it("should display generic error when a Backend error occurs", async () => {
      server.use(http.get("https://dada.api.ledger.com/v1/assets", () => HttpResponse.error()));
      const { getByText, user } = render(<ModularDrawerSharedNavigator />, renderOptions);
      advanceTimers();

      await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));

      expect(
        await screen.findByText(/Something went wrong on our end\. Please try again later/i),
      ).toBeVisible();
    });

    it("should display generic error when an internet error occurs", async () => {
      setNetInfoState({
        isConnected: false,
        isInternetReachable: false,
        type: NetInfoStateType.none,
      });

      const { getByText, user } = render(<ModularDrawerSharedNavigator />, renderOptions);

      await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
      advanceTimers();

      await waitFor(() =>
        expect(getByText(/No internet connection. Please try again/i)).toBeVisible(),
      );
    });
  },
);

describe("ModularDrawer — Lumen BottomSheet specific", () => {
  const lumenOverride = {
    overrideInitialState: (state: State) => ({
      ...state,
      settings: {
        ...state.settings,
        overriddenFeatureFlags: { ...mockedFF, lwmWallet40: { enabled: true } },
      },
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setNetInfoState();
  });

  it("should show BottomSheetHeader title and hide legacy Title when Lumen path is active", async () => {
    const { getByText, queryByTestId, getByTestId, user } = render(
      <ModularDrawerSharedNavigator />,
      lumenOverride,
    );

    await user.press(getByText(WITHOUT_ACCOUNT_SELECTION));
    act(() => jest.advanceTimersByTime(500));

    await waitFor(() => expect(getByText(/bitcoin/i)).toBeVisible());

    expect(queryByTestId("modular-drawer-step-title")).toBeNull();
    expect(getByTestId("modular-drawer-Asset-title")).toBeVisible();
  });
});
