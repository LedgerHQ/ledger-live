import React from "react";
import { renderWithMockedCounterValuesProvider, screen } from "tests/testSetup";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import { mockOnAssetSelected, mockDomMeasurements } from "./shared";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useGroupedCurrenciesByProvider } from "../__mocks__/useGroupedCurrenciesByProvider.mock";
import {
  arbitrumCurrency,
  bitcoinCurrency,
  ethereumCurrency,
} from "../__mocks__/useSelectAssetFlow.mock";
import { ARB_ACCOUNT, BTC_ACCOUNT, ETH_ACCOUNT, ETH_ACCOUNT_2 } from "../__mocks__/accounts.mock";

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

beforeEach(async () => {
  mockDomMeasurements();
  LiveConfig.setConfig(liveConfig);
});

const mockedInitialState = {
  initialState: {
    accounts: [ETH_ACCOUNT, ETH_ACCOUNT_2, BTC_ACCOUNT, ARB_ACCOUNT],
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
  },
};

const mockCurrencies = [ethereumCurrency, bitcoinCurrency, arbitrumCurrency];

describe("ModularDrawerFlowManager - Modules configuration", () => {
  it("should display balance on the right at assetSelection step by default", () => {
    renderWithMockedCounterValuesProvider(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        source="sourceTest"
        flow="flowTest"
      />,
      mockedInitialState,
    );

    const ethereum = screen.getByText(/ethereum/i);
    expect(ethereum).toBeVisible();
    const ethereumBalance = screen.getByText(/23.4663 eth/i);
    expect(ethereumBalance).toBeVisible();
    const usdBalance = screen.getByText(/\$65,081.79/i);
    expect(usdBalance).toBeVisible();
  });

  it("should display balance on the right at assetSelection step", () => {
    renderWithMockedCounterValuesProvider(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        drawerConfiguration={{
          assets: {
            rightElement: "balance",
          },
        }}
        source="sourceTest"
        flow="flowTest"
      />,
      mockedInitialState,
    );

    const ethereum = screen.getByText(/ethereum/i);
    expect(ethereum).toBeVisible();
    const ethereumBalance = screen.getByText(/23.4663 eth/i);
    expect(ethereumBalance).toBeVisible();
    const usdBalance = screen.getByText(/\$65,081.79/i);
    expect(usdBalance).toBeVisible();
  });

  it("should not display balance on the right at assetSelection step when enableModularization is false ", () => {
    renderWithMockedCounterValuesProvider(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        drawerConfiguration={{
          assets: {
            rightElement: "balance",
          },
        }}
        source="sourceTest"
        flow="flowTest"
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
      },
    );

    const ethereum = screen.getByText(/ethereum/i);
    expect(ethereum).toBeVisible();
    const ethereumBalance = screen.queryByText(/23.4663 eth/i);
    expect(ethereumBalance).toBeNull();
    const usdBalance = screen.queryByText(/\$65,081.79/i);
    expect(usdBalance).toBeNull();
  });

  it("should display number of accounts for network with numberOfAccounts flag", async () => {
    const { user } = renderWithMockedCounterValuesProvider(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        source="sourceTest"
        flow="flowTest"
        drawerConfiguration={{ networks: { leftElement: "numberOfAccounts" } }}
      />,
      mockedInitialState,
    );

    const ethereum = screen.getByText(/ethereum/i);

    await user.click(ethereum);

    const accountCountArbitrum = screen.getByText(/1 account/i);
    const accountCountEthereum = screen.getByText(/2 accounts/i);

    [accountCountArbitrum, accountCountEthereum].forEach(accountCount => {
      expect(accountCount).toBeVisible();
    });
  });

  it("should display the total balance of an asset a specific network", async () => {
    const { user } = renderWithMockedCounterValuesProvider(
      <ModularDrawerFlowManager
        currencies={mockCurrencies}
        onAssetSelected={mockOnAssetSelected}
        source="sourceTest"
        flow="flowTest"
        drawerConfiguration={{ networks: { rightElement: "balance" } }}
      />,
      mockedInitialState,
    );

    await user.click(screen.getByText(/ethereum/i));
    expect(screen.getByText(/select network/i)).toBeVisible();

    const ethereumBalance = screen.getByText(/23.4663 eth/i);
    expect(ethereumBalance).toBeVisible();
    const usdBalance = screen.getByText(/\$64,796.91/i);
    expect(usdBalance).toBeVisible();
    const arbitrumBalance = screen.getByText(/0 eth/i);
    expect(arbitrumBalance).toBeVisible();
    const usdAbrBalance = screen.getByText(/\$0.00/i);
    expect(usdAbrBalance).toBeVisible();
  });
});
