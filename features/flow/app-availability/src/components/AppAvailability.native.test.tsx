import React from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
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

function renderGate(children: React.ReactNode) {
  return render(
    <LinkingProvider config={{ openExternal }}>
      <I18nTestProvider resources={COPY}>
        <AppAvailability>{children}</AppAvailability>
      </I18nTestProvider>
    </LinkingProvider>,
  );
}

describe("AppAvailability (native)", () => {
  beforeEach(() => {
    mockedUseCalCheck.mockReturnValue({ status: "available" });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render children when not blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    renderGate(<Text>Allowed</Text>);

    expect(screen.getByText("Allowed")).toBeTruthy();
  });

  it("should render children while the check is pending", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: undefined, isLoading: true });

    renderGate(<Text>Allowed</Text>);

    expect(screen.getByText("Allowed")).toBeTruthy();
  });

  it("should render children when data is undefined after loading", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: undefined, isLoading: false });

    renderGate(<Text>Allowed</Text>);

    expect(screen.getByText("Allowed")).toBeTruthy();
  });

  it("should render the unavailable view when geo-blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: true, isLoading: false });

    renderGate(<Text>Allowed</Text>);

    expect(screen.queryByText("Allowed")).toBeNull();
    expect(screen.getByText(GEO_TITLE)).toBeTruthy();
    expect(screen.getByText(GEO_DESCRIPTION)).toBeTruthy();
    expect(screen.getByText(LEARN_MORE)).toBeTruthy();
    expect(screen.getByTestId("app-availability-learn-more")).toBeTruthy();
  });

  it("should open the learn more URL when the action is pressed", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: true, isLoading: false });

    renderGate(<Text>Allowed</Text>);

    fireEvent.press(screen.getByTestId("app-availability-learn-more"));

    expect(openExternal).toHaveBeenCalledTimes(1);
    expect(openExternal).toHaveBeenCalledWith(urls.geoBlockLearnMore);
  });

  it("should render service-unavailable copy when CAL failed", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });
    mockedUseCalCheck.mockReturnValue({
      status: "unavailable",
      reason: "serviceUnavailable",
    });

    renderGate(<Text>Allowed</Text>);

    expect(screen.queryByText("Allowed")).toBeNull();
    expect(screen.getByText(SERVICE_TITLE)).toBeTruthy();
    expect(screen.getByText(SERVICE_DESCRIPTION)).toBeTruthy();
    expect(screen.queryByText(GEO_TITLE)).toBeNull();
  });

  it("should render custom children when not blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    renderGate(<Text>Custom Content</Text>);

    expect(screen.getByText("Custom Content")).toBeTruthy();
  });
});
