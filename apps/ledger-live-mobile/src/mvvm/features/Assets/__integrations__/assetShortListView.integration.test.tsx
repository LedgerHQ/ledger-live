import React from "react";
import { render, screen } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { MockedAccounts } from "../../Accounts/__integrations__/mockedAccounts";
import { AssetShortListView } from "../components/AssetsShortListView";
import { ScreenName } from "~/const";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Props } from "../hooks/useAssetsListViewModel";

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculate: ({ value }: { value: number }) => value,
}));

const INITIAL_STATE = {
  overrideInitialState: (state: State) => ({
    ...state,
    accounts: MockedAccounts,
    settings: {
      ...state.settings,
      readOnlyModeEnabled: false,
    },
  }),
};

const Stack = createNativeStackNavigator();

const renderComponent = (props: Omit<Props, "sourceScreenName"> = {}) => {
  const ScreenComponent = () => (
    <AssetShortListView sourceScreenName={ScreenName.Portfolio} {...props} />
  );

  return render(
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TestScreen" component={ScreenComponent} />
    </Stack.Navigator>,
    INITIAL_STATE,
  );
};

describe("AssetShortListView", () => {
  it("should render all assets when no limit is set", () => {
    renderComponent({});

    const assetsList = screen.getByTestId("AssetsList");
    expect(assetsList).toBeVisible();

    // MockedAccounts has 7 accounts across 7 currencies + 1 USDT token = 8 assets
    const expectedAssetCount = 8;
    const assetNames = screen.getAllByTestId(/^assetItem-.+-name$/);
    const balanceElements = screen.getAllByTestId(/^assetItem-.+-balance$/);
    const tickerElements = screen.getAllByTestId(/^assetItem-.+-ticker$/);
    // Delta component renders "−" placeholder when percentage is 0/null/NaN
    // (testID is not propagated in the placeholder branch)
    const minusSigns = screen.getAllByText("−");

    expect(assetNames.length).toBe(expectedAssetCount);
    expect(balanceElements.length).toBe(expectedAssetCount);
    expect(tickerElements.length).toBe(expectedAssetCount);
    expect(minusSigns.length).toBe(expectedAssetCount);
  });

  it("should render asset currency names", () => {
    renderComponent({});
    // Use testIDs to avoid ambiguity (e.g. "Dash" name vs "DASH" ticker)
    expect(screen.getByTestId("assetItem-Cronos-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-Dash-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-Dogecoin-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-Energy Web-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-Ethereum Classic-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-Linea-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-NEAR-name")).toBeVisible();
    expect(screen.getByTestId("assetItem-Tether-name")).toBeVisible();
  });

  it("should limit the number of displayed assets", () => {
    renderComponent({ limitNumberOfAssets: 3 });
    const assetNames = screen.getAllByTestId(/^assetItem-.+-name$/);
    expect(assetNames.length).toBe(3);
  });

  it("should render an empty list when there are no accounts", () => {
    const ScreenComponent = () => <AssetShortListView sourceScreenName={ScreenName.Portfolio} />;

    render(
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TestScreen" component={ScreenComponent} />
      </Stack.Navigator>,
      {
        overrideInitialState: (state: State) => ({
          ...state,
          accounts: {
            ...state.accounts,
            active: [],
          },
        }),
      },
    );

    const assetsList = screen.getByTestId("AssetsList");
    expect(assetsList).toBeVisible();
    expect(screen.queryAllByTestId(/^assetItem-.+-name$/).length).toBe(0);
  });

  it("should handle asset press", async () => {
    const { user } = renderComponent({ limitNumberOfAssets: 3 });
    const assetItems = screen.getAllByTestId(/^assetItem-(?!.*-(name|ticker|balance|delta)$)/);
    expect(assetItems.length).toBe(3);

    // Press the first asset — should not throw
    await user.press(assetItems[0]);
  });
});
