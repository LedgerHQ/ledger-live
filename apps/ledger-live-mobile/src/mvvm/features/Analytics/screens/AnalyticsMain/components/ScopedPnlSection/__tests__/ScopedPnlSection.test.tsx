import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { FiatCurrencyTickerSchema } from "@domain/entity-currency-fiat";
import { ScopedPnlSection, SCOPED_PNL_TEST_IDS } from "..";
import { createAnalyticsAccount } from "../../../../../__fixtures__/accountAnalyticsFixtures";

const eth = createAnalyticsAccount("scoped-pnl-eth");

function renderSection(
  positionIds: string[],
  catalogStatus: "ready" | "loading" | "error" = "ready",
) {
  render(
    <ScopedPnlSection
      scope={{
        assetId: null,
        accountId: null,
        fiatCurrencyId: FiatCurrencyTickerSchema.parse("USD"),
        positionIds,
      }}
      catalogStatus={catalogStatus}
      statusContent={<Text>status</Text>}
      positions={[eth]}
    />,
  );
}

describe("ScopedPnlSection", () => {
  it("should show a skeleton while the catalog loads", () => {
    renderSection([eth.id], "loading");
    expect(screen.getByTestId(SCOPED_PNL_TEST_IDS.skeleton)).toBeVisible();
  });

  it("should show the status when the selection references a removed position", () => {
    renderSection(["removed"]);
    expect(screen.getByTestId(SCOPED_PNL_TEST_IDS.unavailable)).toBeVisible();
    expect(screen.getByText("status")).toBeVisible();
  });

  it("should render nothing for an empty selection", () => {
    renderSection([]);
    expect(screen.queryByTestId("analytics-pnl-section")).toBeNull();
    expect(screen.queryByTestId(SCOPED_PNL_TEST_IDS.unavailable)).toBeNull();
  });

  it("should show the PnL of the selected positions", () => {
    renderSection([eth.id]);
    expect(screen.getByTestId("analytics-pnl-section")).toBeVisible();
  });
});
