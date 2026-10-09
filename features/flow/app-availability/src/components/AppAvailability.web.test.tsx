import React from "react";
import { render, screen } from "@testing-library/react";
import { useCheckOfacGeoBlockQuery } from "@domain/api-ofac";
import { mockOfacCheckQuery } from "../test/mockOfacCheckQuery";
import { AppAvailability } from "./AppAvailability";

jest.mock("@domain/api-ofac", () => ({
  useCheckOfacGeoBlockQuery: jest.fn(),
}));

const mockedUseCheckQuery = jest.mocked(useCheckOfacGeoBlockQuery);

const TITLE = "Location unavailable";
const DESCRIPTION = "Ledger Wallet is not available in this location.";

describe("AppAvailability (web)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render children when not blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    render(
      <AppAvailability title={TITLE} description={DESCRIPTION}>
        <div data-testid="child">Visible</div>
      </AppAvailability>,
    );

    expect(screen.getByTestId("child")).toBeVisible();
    expect(screen.queryByRole("heading", { name: TITLE })).toBeNull();
  });

  it("should render children while the check is pending", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: undefined, isLoading: true });

    render(
      <AppAvailability title={TITLE} description={DESCRIPTION}>
        <div data-testid="child">Visible</div>
      </AppAvailability>,
    );

    expect(screen.getByTestId("child")).toBeVisible();
  });

  it("should render children when data is undefined after loading", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: undefined, isLoading: false });

    render(
      <AppAvailability title={TITLE} description={DESCRIPTION}>
        <div data-testid="child">Visible</div>
      </AppAvailability>,
    );

    expect(screen.getByTestId("child")).toBeVisible();
  });

  it("should render children when the query fails (fail-open)", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, {
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(
      <AppAvailability title={TITLE} description={DESCRIPTION}>
        <div data-testid="child">Visible despite error</div>
      </AppAvailability>,
    );

    expect(screen.getByTestId("child")).toBeVisible();
  });

  it("should render the unavailable view when geo-blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: true, isLoading: false });

    render(
      <AppAvailability title={TITLE} description={DESCRIPTION}>
        <div data-testid="child">Should not be visible</div>
      </AppAvailability>,
    );

    expect(screen.queryByTestId("child")).toBeNull();
    expect(screen.getByRole("heading", { name: TITLE })).toBeVisible();
    expect(screen.getByText(DESCRIPTION)).toBeVisible();
  });

  it("should render nothing when children is null and not blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    const { container } = render(
      <AppAvailability title={TITLE} description={DESCRIPTION}>
        {null}
      </AppAvailability>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should render custom children when not blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    render(
      <AppAvailability title={TITLE} description={DESCRIPTION}>
        <span>Custom Content</span>
      </AppAvailability>,
    );

    expect(screen.getByText("Custom Content")).toBeVisible();
  });
});
