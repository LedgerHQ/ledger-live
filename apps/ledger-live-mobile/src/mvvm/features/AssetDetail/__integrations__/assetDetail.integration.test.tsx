import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import AssetDetailNavigator from "../Navigator";
import { ASSET_DETAIL_TEST_IDS } from "../testIds";

const Stack = createNativeStackNavigator();

function AssetDetailTestNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={NavigatorName.AssetDetail}
        component={AssetDetailNavigator}
        initialParams={{
          screen: ScreenName.AssetDetail,
          params: { currencyId: "bitcoin" },
        }}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

describe("AssetDetail screen layout", () => {
  it("renders all section placeholders and BalanceGraph", () => {
    render(<AssetDetailTestNavigator />);

    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.screen)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.balanceGraph)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.balanceDetails)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.marketStats)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.transactions)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.ctas)).toBeVisible();
  });

  it("renders the market price section with title and chart placeholder", () => {
    render(<AssetDetailTestNavigator />);

    expect(screen.getByText("Market price")).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.chartPlaceholder)).toBeVisible();
    expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.receiveButton)).toBeNull();
  });

  it("renders the addresses section with title and add button", () => {
    render(<AssetDetailTestNavigator />);

    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeVisible();
    expect(screen.getByText("Addresses")).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addAccount)).toBeVisible();
    expect(screen.getByText("Add")).toBeVisible();
  });
});
