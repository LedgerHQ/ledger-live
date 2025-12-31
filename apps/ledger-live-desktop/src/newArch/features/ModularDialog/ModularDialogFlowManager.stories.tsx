import {
  assetsLeftElementOptions,
  assetsRightElementOptions,
  filterOptions,
  networksLeftElementOptions,
  networksRightElementOptions,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, waitFor, within, screen } from "@storybook/test";
import React from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { track } from "~/renderer/analytics/__mocks__/segment";
import { ARB_ACCOUNT, BTC_ACCOUNT, ETH_ACCOUNT } from "../__mocks__/accounts.mock";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import ModularDialogFlowManager from "./ModularDialogFlowManager";
import { ModularDialogFlowManagerProps } from "./types";
import modularDrawerReducer, { openDialog } from "~/renderer/reducers/modularDrawer";
import { useDispatch } from "LLD/hooks/redux";
import { setEnv } from "@ledgerhq/live-env";
import { setSupportedCurrencies } from "@ledgerhq/coin-framework/lib-es/currencies/support";
import {
  makeMockedFeatureFlagsProviderWrapper,
  makeMockedContextValue,
} from "@ledgerhq/live-common/featureFlags/mock";

setEnv("MOCK", "true");

setSupportedCurrencies(["ethereum", "arbitrum", "bitcoin"]);

const mockedFeatureFlags = {
  lldModularDrawer: { enabled: true, params: { enableModularization: true } },
};

const FeatureFlagsProvider = makeMockedFeatureFlagsProviderWrapper(
  makeMockedContextValue(mockedFeatureFlags),
);

const onAccountSelected = fn();

const createMockState = () => ({
  accounts: [ARB_ACCOUNT, ETH_ACCOUNT, BTC_ACCOUNT],
  wallet: {
    accountNames: new Map([
      ["bitcoin1", "bitcoin-account-1"],
      ["ethereum1", "ethereum-account-1"],
      ["arbitrum1", "arbitrum-account-1"],
    ]),
  },
  currency: {
    type: "FiatCurrency" as const,
    ticker: "USD",
    name: "US Dollar",
    symbol: "$",
    units: [
      {
        code: "$",
        name: "US Dollar",
        magnitude: 2,
        showAllDigits: true,
        prefixCode: true,
      },
    ],
  },
  application: { debug: {} },
  modularDrawer: {
    flow: "Modular Asset Flow",
    isOpen: false,
    isDebuggingDuplicates: false,
    source: "sourceTest",
    dialogParams: { onAccountSelected },
    enableModularization: true,
  },
  countervalues: { countervalues: { state: { cache: true } } },
});

const initialMockState = createMockState();

const store = configureStore({
  reducer: {
    accounts: (state = initialMockState.accounts) => state,
    wallet: (state = initialMockState.wallet) => state,
    currency: (state = initialMockState.currency) => state,
    application: (state = initialMockState.application) => state,
    modularDrawer: modularDrawerReducer,
    countervalues: (state = initialMockState.countervalues) => state,
    assetsDataApi: assetsDataApi.reducer,
  },
  preloadedState: {
    modularDrawer: initialMockState.modularDrawer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).concat(assetsDataApi.middleware),
});

const OpenDialogButton = () => {
  const dispatch = useDispatch();
  return (
    <button onClick={() => dispatch(openDialog({}))} style={{ backgroundColor: "red" }}>
      open dialog
    </button>
  );
};

type ExtraStoryArgs = {
  // "default" is used as the primitive undefined option in the dropdown
  assetsLeftElement?: (typeof assetsLeftElementOptions)[number] | "default";
  assetsRightElement?: (typeof assetsRightElementOptions)[number] | "default";
  networksLeftElement?: (typeof networksLeftElementOptions)[number] | "default";
  networksRightElement?: (typeof networksRightElementOptions)[number] | "default";
  assetsFilter?: (typeof filterOptions)[number] | "default";
};

type StoryArgs = ModularDialogFlowManagerProps & ExtraStoryArgs;

const meta: Meta<StoryArgs> = {
  title: "ModularDialog/ModularDialogFlowManager",
  component: ModularDialogFlowManager,
  args: {},
  argTypes: {
    assetsFilter: {
      options: [...filterOptions, "default"],
      control: { type: "select" },
    },
    assetsLeftElement: {
      options: [...assetsLeftElementOptions, "default"],
      control: { type: "select" },
    },
    assetsRightElement: {
      options: [...assetsRightElementOptions, "default"],
      control: { type: "select" },
    },
    networksLeftElement: {
      options: [...networksLeftElementOptions, "default"],
      control: { type: "select" },
    },
    networksRightElement: {
      options: [...networksRightElementOptions, "default"],
      control: { type: "select" },
    },
  },
  decorators: [
    Story => (
      <div style={{ minHeight: "400px", position: "relative", margin: "50px" }}>
        <FeatureFlagsProvider>
          <Provider store={store}>
            <OpenDialogButton />
            <Story />
          </Provider>
        </FeatureFlagsProvider>
      </div>
    ),
  ],
};

export default meta;

export const CustomDialogConfig: StoryObj<StoryArgs> = {
  parameters: {
    controls: {
      exclude: [
        "currencies",
        "source",
        "flow",
        "dialogConfiguration",
        "onAssetSelected",
        "onAccountSelected",
      ],
    },
  },
  render: args => {
    const {
      assetsLeftElement,
      assetsRightElement,
      assetsFilter,
      networksLeftElement,
      networksRightElement,
    } = args;

    const dialogConfiguration = {
      assets: {
        leftElement: assetsLeftElement === "default" ? undefined : assetsLeftElement,
        rightElement: assetsRightElement === "default" ? undefined : assetsRightElement,
        filter: assetsFilter === "default" ? undefined : assetsFilter,
      },
      networks: {
        leftElement: networksLeftElement === "default" ? undefined : networksLeftElement,
        rightElement: networksRightElement === "default" ? undefined : networksRightElement,
      },
    };

    return (
      <div>
        <div style={{ color: "#333", backgroundColor: "#f9f9f9", padding: "5px" }}>
          <p style={{ fontSize: "16px", marginBottom: "8px" }}>
            Use the storybook controls below to alter the{" "}
            <span style={{ fontWeight: 600 }}>dialogConfiguration</span> parameters and feature
            flags:
          </p>
          <p style={{ fontSize: "14px", marginBottom: "16px", color: "#555" }}>
            &quot;undefined&quot; represents no element shown, &quot;default&quot; represents the
            default element if the parameter is not provided in the dialogConfiguration object.
          </p>
          <ul style={{ paddingLeft: "20px", fontSize: "14px", marginBottom: "16px" }}>
            <li>
              <span style={{ fontWeight: 600 }}>assetsFilter:</span> Element to display at the top
              of the dialog to filter assets.
            </li>
            <li>
              <span style={{ fontWeight: 600 }}>assetsLeftElement:</span> Element to display on the
              left side of the assets dialog. Defaults to undefined.
            </li>
            <li>
              <span style={{ fontWeight: 600 }}>assetsRightElement:</span> Element to display on the
              right side of the assets dialog. Defaults to balance.
            </li>
            <li>
              <span style={{ fontWeight: 600 }}>networksLeftElement:</span> Element to display on
              the left side of the networks dialog. Defaults to undefined.
            </li>
            <li>
              <span style={{ fontWeight: 600 }}>networksRightElement:</span> Element to display on
              the right side of the networks dialog. Defaults to undefined.
            </li>
          </ul>
          <pre
            style={{
              fontFamily: "monospace",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "13px",
            }}
          >
            {JSON.stringify({ dialogConfiguration }, null, 2)}
          </pre>
        </div>
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            marginTop: "50px",
            paddingTop: "50px",
            borderTop: "1px solid #ccc",
          }}
        >
          <ModularDialogFlowManager
            // Changing dialogConfiguration may alter which hooks are called.
            // The dynamic key ensures the component is remounted to avoid hook order violations
            key={JSON.stringify(args)}
          />
        </div>
      </div>
    );
  },
};

export const TestSelectAccountFlow: StoryObj<StoryArgs> = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const openButton = await canvas.findByText("open dialog");
    await userEvent.click(openButton);

    const waitForAnimationExit = (text: RegExp) =>
      waitFor(() => {
        const [el] = screen.queryAllByText(text);
        if (screen.queryAllByText(text).length !== 1) throw new Error();
        return el;
      });

    const ethereumAsset = await screen.findByText(/ethereum/i);

    await userEvent.click(ethereumAsset);

    expect(track).toHaveBeenLastCalledWith("asset_clicked", {
      asset: "Ethereum",
      flow: "Modular Asset Flow",
      page: "Modular Asset Selection",
      source: "sourceTest",
      asset_component_features: {
        apy: false,
        balance: false,
        filter: false,
        market_trend: false,
      },
    });

    const arbitrumNetwork = await waitForAnimationExit(/arbitrum/i);

    await userEvent.click(arbitrumNetwork);

    const arbitrumAccount = await waitForAnimationExit(/Arbitrum 2/i);
    expect(arbitrumAccount).toBeInTheDocument();

    await userEvent.click(arbitrumAccount);

    expect(onAccountSelected).toHaveBeenCalledWith(ARB_ACCOUNT);
  },
};
