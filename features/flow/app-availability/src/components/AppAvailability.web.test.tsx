import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useCheckOfacGeoBlockQuery } from "@domain/api-ofac";
import { I18nTestProvider } from "@shared/i18n/testing";
import { LinkingProvider } from "@shared/linking";
import { mockOfacCheckQuery } from "../test/mockOfacCheckQuery";
import { urls } from "../urls";
import { useCalCheck } from "../hooks/useCalCheck";
import { AppAvailability } from "./AppAvailability";

jest.mock("@domain/api-ofac", () => ({
  useCheckOfacGeoBlockQuery: jest.fn(),
}));

jest.mock("../hooks/useCalCheck", () => ({
  useCalCheck: jest.fn(),
}));

const mockedUseCheckQuery = jest.mocked(useCheckOfacGeoBlockQuery);
const mockedUseCalCheck = jest.mocked(useCalCheck);
const openExternal = jest.fn();

const COPY = {
  en: {
    translation: {
      "geoBlocking.title": "Location unavailable",
      "geoBlocking.description": "Ledger Wallet is not available in this location.",
      "geoBlocking.learnMore": "Learn more",
      "serviceUnavailable.title": "Ledger Wallet is currently unavailable",
      "serviceUnavailable.description": "This does not impact your assets. Please try again later.",
    },
  },
};

const GEO_TITLE = COPY.en.translation["geoBlocking.title"];
const GEO_DESCRIPTION = COPY.en.translation["geoBlocking.description"];
const LEARN_MORE = COPY.en.translation["geoBlocking.learnMore"];
const SERVICE_TITLE = COPY.en.translation["serviceUnavailable.title"];
const SERVICE_DESCRIPTION = COPY.en.translation["serviceUnavailable.description"];

const CAL_URL = "https://cal.test";
const CLIENT_VERSION = "1.2.3";

function renderGate(children: React.ReactNode) {
  return render(
    <LinkingProvider config={{ openExternal }}>
      <I18nTestProvider resources={COPY}>
        <AppAvailability calServiceUrl={CAL_URL} ledgerClientVersion={CLIENT_VERSION}>
          {children}
        </AppAvailability>
      </I18nTestProvider>
    </LinkingProvider>,
  );
}

describe("AppAvailability (web)", () => {
  beforeEach(() => {
    mockedUseCalCheck.mockReturnValue({ status: "available" });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render children when not blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    renderGate(<div data-testid="child">Visible</div>);

    expect(screen.getByTestId("child")).toBeVisible();
    expect(screen.queryByRole("heading", { name: GEO_TITLE })).toBeNull();
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
    expect(screen.getByRole("heading", { name: GEO_TITLE })).toBeVisible();
    expect(screen.getByText(GEO_DESCRIPTION)).toBeVisible();
    expect(screen.getByRole("button", { name: LEARN_MORE })).toBeVisible();
  });

  it("should open the learn more URL when the action is pressed", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: true, isLoading: false });

    renderGate(<div data-testid="child">Should not be visible</div>);

    fireEvent.click(screen.getByRole("button", { name: LEARN_MORE }));

    expect(openExternal).toHaveBeenCalledTimes(1);
    expect(openExternal).toHaveBeenCalledWith(urls.geoBlockLearnMore);
  });

  it("should render service-unavailable copy when CAL failed", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });
    mockedUseCalCheck.mockReturnValue({
      status: "unavailable",
      reason: "serviceUnavailable",
    });

    renderGate(<div data-testid="child">Should not be visible</div>);

    expect(screen.queryByTestId("child")).toBeNull();
    expect(screen.getByRole("heading", { name: SERVICE_TITLE })).toBeVisible();
    expect(screen.getByText(SERVICE_DESCRIPTION)).toBeVisible();
    expect(screen.queryByRole("heading", { name: GEO_TITLE })).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("should render children again when CAL becomes available", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });
    mockedUseCalCheck.mockReturnValue({
      status: "unavailable",
      reason: "serviceUnavailable",
    });

    const { rerender } = renderGate(<div data-testid="child">Visible</div>);

    expect(screen.queryByTestId("child")).toBeNull();

    mockedUseCalCheck.mockReturnValue({ status: "available" });
    rerender(
      <LinkingProvider config={{ openExternal }}>
        <I18nTestProvider resources={COPY}>
          <AppAvailability calServiceUrl={CAL_URL} ledgerClientVersion={CLIENT_VERSION}>
            <div data-testid="child">Visible</div>
          </AppAvailability>
        </I18nTestProvider>
      </LinkingProvider>,
    );

    expect(screen.getByTestId("child")).toBeVisible();
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
