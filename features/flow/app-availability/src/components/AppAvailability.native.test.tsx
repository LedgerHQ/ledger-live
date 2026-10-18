import React from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { useCheckOfacGeoBlockQuery } from "@domain/api-ofac";
import { I18nTestProvider } from "@shared/i18n/testing";
import { LinkingProvider } from "@shared/linking";
import { mockOfacCheckQuery } from "../test/mockOfacCheckQuery";
import { urls } from "../urls";
import { AppAvailability } from "./AppAvailability";

jest.mock("@domain/api-ofac", () => ({
  useCheckOfacGeoBlockQuery: jest.fn(),
}));

const mockedUseCheckQuery = jest.mocked(useCheckOfacGeoBlockQuery);
const openExternal = jest.fn();

const COPY = {
  en: {
    translation: {
      "geoBlocking.title": "Location unavailable",
      "geoBlocking.description": "Ledger Wallet is not available in this location.",
      "geoBlocking.learnMore": "Learn more",
    },
  },
};

const TITLE = COPY.en.translation["geoBlocking.title"];
const DESCRIPTION = COPY.en.translation["geoBlocking.description"];
const LEARN_MORE = COPY.en.translation["geoBlocking.learnMore"];

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

  it("should render custom children when not blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    renderGate(<Text>Custom Content</Text>);

    expect(screen.getByText("Custom Content")).toBeTruthy();
  });
});
