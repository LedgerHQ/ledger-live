import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import {
  ARB_ACCOUNT,
  BASE_ACCOUNT,
  BTC_ACCOUNT,
  ETH_ACCOUNT,
  ETH_ACCOUNT_2,
  SCROLL_ACCOUNT,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/accounts.mock";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import BigNumber from "bignumber.js";
import React from "react";
import { renderWithMockedCounterValuesProvider, screen, waitFor } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import {
  arbitrumCurrency,
  baseCurrency,
  bitcoinCurrency,
  ethereumCurrency,
  scrollCurrency,
} from "../../__mocks__/useSelectAssetFlow.mock";
import { mockDomMeasurements, mockOnAssetSelected } from "../../__tests__/shared";
import ModularDialogFlowManager from "../ModularDialogFlowManager";

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockUseAcceptedCurrency(),
}));

const mockUseAcceptedCurrency = jest.fn(() => () => true);

beforeEach(async () => {
  mockDomMeasurements();
  LiveConfig.setConfig(liveConfig);
});

const mockedInitialState = {
  initialState: {
    accounts: [
      ETH_ACCOUNT,
      ETH_ACCOUNT_2,
      BTC_ACCOUNT,
      ARB_ACCOUNT,
      BASE_ACCOUNT,
      { ...SCROLL_ACCOUNT, balance: new BigNumber(34455).multipliedBy(10 ** 18) },
    ],
    settings: {
      ...INITIAL_STATE,
      overriddenFeatureFlags: {
        lldModularDrawer: {
          enabled: true,
          params: {
            enableModularization: true,
          },
        },
      },
    },
    modularDrawer: { isOpen: true },
  },
};

const mockCurrencies = [ethereumCurrency, bitcoinCurrency, arbitrumCurrency].map(c => c.id);

describe("ModularDialogFlowManager - Modules configuration", () => {
  // This is tempory as in the future balance will be displayed by default for all assets but right now it's not the case
  it("should display balance on the right at assetSelection by default", async () => {
    const mixedCurrencies = [
      baseCurrency,
      arbitrumCurrency,
      scrollCurrency,
      ethereumCurrency,
      bitcoinCurrency,
    ];
    renderWithMockedCounterValuesProvider(
      <ModularDialogFlowManager
        currencies={mixedCurrencies.map(c => c.id)}
        onAssetSelected={mockOnAssetSelected}
      />,
      mockedInitialState,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    expect(screen.queryByText(/base/i)).toBeNull();
    expect(screen.queryByText(/scroll/i)).toBeNull();

    expect(screen.queryByText(/\$95,622,923.34/i)).toBeVisible();
    expect(screen.queryByText(/34,478.4 eth/i)).toBeVisible();
  });

  it("should display balance on the right at assetSelection step", async () => {
    renderWithMockedCounterValuesProvider(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        drawerConfiguration={{
          assets: {
            rightElement: "balance",
          },
        }}
      />,
      mockedInitialState,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumBalance = screen.getByText(/34,478.4 ETH/i);
    expect(ethereumBalance).toBeVisible();
    const usdBalance = screen.getByText(/\$95,622,923.34/i);
    expect(usdBalance).toBeVisible();

    const apyTags = screen.queryAllByText(/% APY/i);
    expect(apyTags).toHaveLength(0);
  });

  it("should display APY tag at assetSelection step", async () => {
    renderWithMockedCounterValuesProvider(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        drawerConfiguration={{
          assets: {
            leftElement: "apy",
          },
        }}
      />,
      mockedInitialState,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const apyTag = screen.getAllByText(/% APY/i)[0];
    expect(apyTag).toBeVisible();
  });

  it("should display market trend on the left at assetSelection step", async () => {
    renderWithMockedCounterValuesProvider(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        drawerConfiguration={{
          assets: {
            leftElement: "marketTrend",
          },
        }}
      />,
      mockedInitialState,
    );

    await waitFor(() => expect(screen.getByText(/bitcoin/i)).toBeVisible());
    const bitcoinTicker = screen.getByTestId("asset-item-ticker-btc");
    const bitcoinRow = bitcoinTicker.parentElement;
    const percentIndicator = bitcoinRow?.querySelector('[data-testid="market-percent-indicator"]');
    expect(percentIndicator).toHaveTextContent(/-2.27%$/);
  });

  it("should display market trend on the right at assetSelection step", async () => {
    renderWithMockedCounterValuesProvider(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        drawerConfiguration={{
          assets: {
            rightElement: "marketTrend",
          },
        }}
      />,
      mockedInitialState,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumAsset = screen.getByTestId("asset-item-ticker-eth");
    const percentIndicator = ethereumAsset.querySelector(
      '[data-testid="market-price-indicator-percent"]',
    );
    expect(percentIndicator).toHaveTextContent(/-3.64%$/);
  });

  it("should not display balance on the right at assetSelection step when enableModularization is false ", async () => {
    renderWithMockedCounterValuesProvider(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        drawerConfiguration={{
          assets: {
            rightElement: "balance",
          },
        }}
      />,
      {
        accounts: ETH_ACCOUNT,
        settings: {
          ...INITIAL_STATE,
          overriddenFeatureFlags: {
            lldModularDrawer: {
              enabled: true,
              params: {
                enableModularization: false,
              },
            },
          },
        },
        initialState: {
          modularDrawer: { isOpen: true },
        },
      },
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereumBalance = screen.queryByText(/23.4663 eth/i);
    expect(ethereumBalance).toBeNull();
    const usdBalance = screen.queryByText(/\$65,081.79/i);
    expect(usdBalance).toBeNull();
  });

  it("should display number of accounts for network with numberOfAccounts flag", async () => {
    const { user } = renderWithMockedCounterValuesProvider(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        drawerConfiguration={{ networks: { leftElement: "numberOfAccounts" } }}
      />,
      mockedInitialState,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereum = screen.getByText(/ethereum/i);

    await user.click(ethereum);

    const accountCountArbitrum = screen.getByText(/1 account/i);
    const accountCountEthereum = screen.getByText(/2 accounts/i);

    [accountCountArbitrum, accountCountEthereum].forEach(accountCount => {
      expect(accountCount).toBeVisible();
    });

    const apyTags = screen.queryAllByText(/% APY/);
    expect(apyTags).toHaveLength(0);
  });

  it("should display number of accounts and APY for network with numberOfAccountsAndApy flag", async () => {
    const { user } = renderWithMockedCounterValuesProvider(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        drawerConfiguration={{ networks: { leftElement: "numberOfAccountsAndApy" } }}
      />,
      mockedInitialState,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    const ethereum = screen.getByText(/ethereum/i);
    await user.click(ethereum);

    const accountCountArbitrum = screen.getByText(/1 account/i);
    expect(accountCountArbitrum).toBeVisible();

    const apyTag = screen.getAllByText(/% APY/)[0];
    expect(apyTag).toBeVisible();
  });

  it("should display the total balance of an asset a specific network", async () => {
    const { user } = renderWithMockedCounterValuesProvider(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        drawerConfiguration={{ networks: { rightElement: "balance" } }}
      />,
      mockedInitialState,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    await user.click(screen.getByText(/ethereum/i));
    expect(screen.getAllByText(/select network/i)[0]).toBeVisible();

    const ethereumBalance = screen.getByText(/23.4663 eth/i);
    expect(ethereumBalance).toBeVisible();
    const usdBalance = screen.getByText(/\$65,081.79/i);
    expect(usdBalance).toBeVisible();
    const arbitrumBalance = screen.getByText(/0 eth/i);
    expect(arbitrumBalance).toBeVisible();
    const usdAbrBalance = screen.getByText(/\$0.00/i);
    expect(usdAbrBalance).toBeVisible();
  });

  // this is logically failing because we are not able to retrieve the wanted data consistantly because it depends on the providerId that can be wrongly set in mapping services
  // Skipping because flaky, test to be rewritten in refactor from LIVE-21033
  it.skip("render the eth balance of scroll base and arbitrum as ethereum", async () => {
    renderWithMockedCounterValuesProvider(
      <ModularDialogFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        drawerConfiguration={{ assets: { rightElement: "balance" } }}
      />,
      mockedInitialState,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    expect(screen.queryByText(/base/i)).toBeNull();
    expect(screen.queryByText(/scroll/i)).toBeNull();

    expect(screen.getByText(/\$95,557,841.55/i)).toBeVisible();
    expect(
      screen.getByText((content, _element) => {
        return Boolean(content && /34,?455[\s\u00A0]*ETH/i.test(content));
      }),
    ).toBeVisible();
  });

  it("render the eth balance of ethereum scroll base and arbitrum as ethereum", async () => {
    const mixedCurrencies = [
      baseCurrency,
      arbitrumCurrency,
      scrollCurrency,
      ethereumCurrency,
      bitcoinCurrency,
    ].map(c => c.id);
    renderWithMockedCounterValuesProvider(
      <ModularDialogFlowManager
        currencies={mixedCurrencies}
        onAssetSelected={mockOnAssetSelected}
        drawerConfiguration={{ assets: { rightElement: "balance" } }}
      />,
      mockedInitialState,
    );

    await waitFor(() => expect(screen.getByText(/ethereum/i)).toBeVisible());
    expect(screen.queryByText(/base/i)).toBeNull();
    expect(screen.queryByText(/scroll/i)).toBeNull();

    expect(screen.getByText(/\$95,622,923.34/i)).toBeVisible();
    expect(screen.getByText(/34,478.4 eth/i)).toBeVisible();
  });
});
