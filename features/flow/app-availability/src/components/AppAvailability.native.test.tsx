import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
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

describe("AppAvailability (native)", () => {
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
    expect(screen.getByText(TITLE)).toBeTruthy();
    expect(screen.getByText(DESCRIPTION)).toBeTruthy();
  });

  it("should render custom children when not blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    renderGate(<Text>Custom Content</Text>);

    expect(screen.getByText("Custom Content")).toBeTruthy();
  });
});
