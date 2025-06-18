import React from "react";
import { renderWithMockedCounterValuesProvider, screen } from "tests/testSetup";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import { useGroupedCurrenciesByProvider } from "../__mocks__/useGroupedCurrenciesByProvider.mock";
import { mockOnAssetSelected, currencies, mockDomMeasurements } from "./shared";
import { Mocked_ETH_Account } from "../__mocks__/accounts.mock";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

beforeEach(async () => {
  mockDomMeasurements();
  LiveConfig.setConfig(liveConfig);
});

const mockedInitialState = {
  initialState: {
    accounts: Mocked_ETH_Account,
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

describe("ModularDrawerFlowManager - Modules configuration", () => {
  it("should display balance on the right at assetSelection step by default", () => {
    renderWithMockedCounterValuesProvider(
      <ModularDrawerFlowManager
        currencies={currencies}
        onAssetSelected={mockOnAssetSelected}
        source="sourceTest"
        flow="flowTest"
      />,
      mockedInitialState,
    );

    const ethereum = screen.getByText(/ethereum/i);
    expect(ethereum).toBeVisible();
    const ethereumBalance = screen.getByText(/1 eth/i);
    expect(ethereumBalance).toBeVisible();
    const usdBalance = screen.getByText(/\$2,773.41/i);
    expect(usdBalance).toBeVisible();
  });

  it("should display balance on the right at assetSelection step", () => {
    renderWithMockedCounterValuesProvider(
      <ModularDrawerFlowManager
        currencies={currencies}
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
    const ethereumBalance = screen.getByText(/1 eth/i);
    expect(ethereumBalance).toBeVisible();
    const usdBalance = screen.getByText(/\$2,773.41/i);
    expect(usdBalance).toBeVisible();
  });

  it("should not display balance on the right at assetSelection step when enableModularization is false ", () => {
    renderWithMockedCounterValuesProvider(
      <ModularDrawerFlowManager
        currencies={currencies}
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
        accounts: Mocked_ETH_Account,
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
    const ethereumBalance = screen.queryByText(/1 eth/i);
    expect(ethereumBalance).toBeNull();
    const usdBalance = screen.queryByText(/\$2,773.41/i);
    expect(usdBalance).toBeNull();
  });

  it("should display number of accounts for network with numberOfAccounts flag", async () => {
    const { user } = renderWithMockedCounterValuesProvider(
      <ModularDrawerFlowManager
        currencies={currencies}
        onAssetSelected={mockOnAssetSelected}
        source="sourceTest"
        flow="flowTest"
        drawerConfiguration={{ networks: { leftElement: "numberOfAccounts" } }}
      />,
      mockedInitialState,
    );

    const ethereum = screen.getByText(/ethereum/i);

    await user.click(ethereum);

    const accountCount = screen.getByText(/1 account/i);
    expect(accountCount).toBeVisible();
  });

  it("should display the total balance of an asset a specific network", async () => {
    const { user } = renderWithMockedCounterValuesProvider(
      <ModularDrawerFlowManager
        currencies={currencies}
        onAssetSelected={mockOnAssetSelected}
        source="sourceTest"
        flow="flowTest"
        drawerConfiguration={{ networks: { rightElement: "balance" } }}
      />,
      mockedInitialState,
    );

    await user.click(screen.getByText(/ethereum/i));
    expect(screen.getByText(/select network/i)).toBeVisible();

    const ethereumBalance = screen.getByText(/1 eth/i);
    expect(ethereumBalance).toBeVisible();
    const usdBalance = screen.getByText(/\$2,761.27/i);
    expect(usdBalance).toBeVisible();
  });
});
