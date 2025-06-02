import React from "react";
import { renderWithMockedCounterValuesProvider, screen } from "tests/testSetup";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import { useGroupedCurrenciesByProvider } from "../__mocks__/useGroupedCurrenciesByProvider.mock";
import { mockOnAssetSelected, currencies, mockDomMeasurements } from "./shared";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { Mocked_ETH_Account } from "../__mocks__/accounts.mock";
import { liveConfig } from "@ledgerhq/live-common/config/sharedConfig";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

beforeEach(async () => {
  mockDomMeasurements();
  LiveConfig.setConfig(liveConfig);
});

const mockedInitialState = {
  ...INITIAL_STATE,
  initialState: {
    accounts: Mocked_ETH_Account,
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
      {
        ...INITIAL_STATE,
        initialState: {
          accounts: Mocked_ETH_Account,
        },
      },
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
});
