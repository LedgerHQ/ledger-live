import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { useCheckQuery } from "@domain/api-ofac";
import { mockOfacCheckQuery } from "../test/mockOfacCheckQuery";
import { AppAvailability } from "./AppAvailability";

jest.mock("@domain/api-ofac", () => ({
  useCheckQuery: jest.fn(),
}));

const mockedUseCheckQuery = jest.mocked(useCheckQuery);

const TITLE = "Location unavailable";
const DESCRIPTION = "Ledger Wallet is not available in this location.";

describe("AppAvailability (native)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render children when not blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    render(
      <AppAvailability title={TITLE} description={DESCRIPTION}>
        <Text>Allowed</Text>
      </AppAvailability>,
    );

    expect(screen.getByText("Allowed")).toBeTruthy();
  });

  it("should render children while the check is pending", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: undefined, isLoading: true });

    render(
      <AppAvailability title={TITLE} description={DESCRIPTION}>
        <Text>Allowed</Text>
      </AppAvailability>,
    );

    expect(screen.getByText("Allowed")).toBeTruthy();
  });

  it("should render children when data is undefined after loading", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: undefined, isLoading: false });

    render(
      <AppAvailability title={TITLE} description={DESCRIPTION}>
        <Text>Allowed</Text>
      </AppAvailability>,
    );

    expect(screen.getByText("Allowed")).toBeTruthy();
  });

  it("should render the unavailable view when geo-blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: true, isLoading: false });

    render(
      <AppAvailability title={TITLE} description={DESCRIPTION}>
        <Text>Allowed</Text>
      </AppAvailability>,
    );

    expect(screen.queryByText("Allowed")).toBeNull();
    expect(screen.getByText(TITLE)).toBeTruthy();
    expect(screen.getByText(DESCRIPTION)).toBeTruthy();
  });

  it("should render custom children when not blocked", () => {
    mockOfacCheckQuery(mockedUseCheckQuery, { data: false, isLoading: false });

    render(
      <AppAvailability title={TITLE} description={DESCRIPTION}>
        <Text>Custom Content</Text>
      </AppAvailability>,
    );

    expect(screen.getByText("Custom Content")).toBeTruthy();
  });
});
