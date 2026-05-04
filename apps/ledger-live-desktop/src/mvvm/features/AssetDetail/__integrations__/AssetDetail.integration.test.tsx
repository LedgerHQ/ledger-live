import React from "react";
import { render, renderWithMockedCounterValuesProvider, screen } from "tests/testSetup";
import {
  buildDistributionItem,
  makeIntegrationTokenCurrency,
  setupDistributionRouteMocks,
} from "tests/utils/distributionTestUtils";
import AssetDetail from "../index";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useParams: jest.fn(),
}));

jest.mock("~/renderer/actions/general", () => ({
  ...jest.requireActual("~/renderer/actions/general"),
  useDistribution: jest.fn(),
}));

const { useParams } = jest.requireMock("react-router");
const { useDistribution } = jest.requireMock("~/renderer/actions/general");

describe("AssetDetail integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders asset-specific content when the route matches an item", () => {
    const item = buildDistributionItem();
    setupDistributionRouteMocks(useParams, useDistribution, "bitcoin", {
      bySlug: { bitcoin: item },
      list: [item],
    });

    renderWithMockedCounterValuesProvider(<AssetDetail />);

    expect(screen.getByTestId("asset-detail-header")).toBeVisible();
    expect(screen.getByText("Bitcoin")).toBeVisible();
    expect(screen.getByText("Total balance")).toBeVisible();
    expect(screen.getByTestId("asset-detail-total-balance")).toBeVisible();
    expect(screen.getByText("Market stats")).toBeVisible();
    expect(screen.getByText("Price performance")).toBeVisible();
    expect(screen.getByText("Placeholder market stats content")).toBeVisible();
    expect(screen.getByText("Placeholder performance metrics content")).toBeVisible();
    expect(screen.getByText("Addresses")).toBeVisible();
    expect(screen.getByTestId("asset-detail-address-list")).toBeVisible();
    expect(screen.getByTestId("asset-detail-add-address")).toBeVisible();
    expect(screen.getByText("Add")).toBeVisible();
    expect(screen.queryByText("Asset distribution item not found.")).not.toBeInTheDocument();
  });

  it("renders the not-found state when route item is missing", () => {
    setupDistributionRouteMocks(useParams, useDistribution, "unknown-asset", { list: [] });

    render(<AssetDetail />);

    expect(screen.getByText("Asset distribution item not found.")).toBeVisible();
  });

  it("renders asset-specific content when the route param is encoded", () => {
    const item = buildDistributionItem({
      currency: makeIntegrationTokenCurrency("bitcoin/test", "TBTC", "Bitcoin Test"),
    });
    setupDistributionRouteMocks(useParams, useDistribution, "bitcoin%2Ftest", {
      bySlug: {},
      list: [item],
    });

    renderWithMockedCounterValuesProvider(<AssetDetail />);

    expect(screen.getByTestId("asset-detail-header")).toBeVisible();
    expect(screen.getByText("Bitcoin Test")).toBeVisible();
    expect(screen.getByText("Total balance")).toBeVisible();
    expect(screen.getByText("Market stats")).toBeVisible();
    expect(screen.getByText("Price performance")).toBeVisible();
    expect(screen.getByText("Addresses")).toBeVisible();
    expect(screen.queryByText("Asset distribution item not found.")).not.toBeInTheDocument();
  });

  it("renders the not-found state when the route param cannot be decoded", () => {
    setupDistributionRouteMocks(useParams, useDistribution, "bitcoin%2", { list: [] });

    render(<AssetDetail />);

    expect(screen.getByText("Asset distribution item not found.")).toBeVisible();
  });
});
