import React from "react";
import { render, screen } from "@testing-library/react";
import { useCheckOfacGeoBlockQuery } from "@domain/api-ofac";
import { I18nTestProvider } from "@shared/i18n/testing";
import { mockOfacCheckQuery } from "../test/mockOfacCheckQuery";
import { AppAvailability } from "./AppAvailability";

jest.mock("@domain/api-ofac", () => ({
  useCheckOfacGeoBlockQuery: jest.fn(),
}));

const mockedUseCheckQuery = jest.mocked(useCheckOfacGeoBlockQuery);

const COPY = {
  en: {
    translation: {
      "geoBlocking.title": "Location unavailable",
      "geoBlocking.description": "Ledger Wallet is not available in this location.",
    },
  },
};

const TITLE = COPY.en.translation["geoBlocking.title"];
const DESCRIPTION = COPY.en.translation["geoBlocking.description"];

function renderGate(children: React.ReactNode) {
  return render(
    <I18nTestProvider resources={COPY}>
      <AppAvailability>{children}</AppAvailability>
    </I18nTestProvider>,
  );
}

describe("AppAvailability (web)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render children when not blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    renderGate(<div data-testid="child">Visible</div>);

    expect(screen.getByTestId("child")).toBeVisible();
    expect(screen.queryByRole("heading", { name: TITLE })).toBeNull();
  });

  it("should render children while the check is pending", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: undefined, isLoading: true });

    renderGate(<div data-testid="child">Visible</div>);

    expect(screen.getByTestId("child")).toBeVisible();
  });

  it("should render children when data is undefined after loading", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: undefined, isLoading: false });

    renderGate(<div data-testid="child">Visible</div>);

    expect(screen.getByTestId("child")).toBeVisible();
  });

  it("should render children when the query fails (fail-open)", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, {
      data: undefined,
      isLoading: false,
      isError: true,
    });

    renderGate(<div data-testid="child">Visible despite error</div>);

    expect(screen.getByTestId("child")).toBeVisible();
  });

  it("should render the unavailable view when geo-blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: true, isLoading: false });

    renderGate(<div data-testid="child">Should not be visible</div>);

    expect(screen.queryByTestId("child")).toBeNull();
    expect(screen.getByRole("heading", { name: TITLE })).toBeVisible();
    expect(screen.getByText(DESCRIPTION)).toBeVisible();
  });

  it("should render nothing when children is null and not blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    const { container } = renderGate(null);

    expect(container).toBeEmptyDOMElement();
  });

  it("should render custom children when not blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    renderGate(<span>Custom Content</span>);

    expect(screen.getByText("Custom Content")).toBeVisible();
  });
});
