import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { WaitForAppReady } from "../WaitForAppReady";

jest.mock("@ledgerhq/live-common/api/ofacGeoBlockApi", () => {
  const actual = jest.requireActual<typeof import("@ledgerhq/live-common/api/ofacGeoBlockApi")>(
    "@ledgerhq/live-common/api/ofacGeoBlockApi",
  );
  return {
    ...actual,
    ofacGeoBlockApi: {
      ...actual.ofacGeoBlockApi,
      useCheckQuery: jest.fn(() => ({ isLoading: false })),
    },
  };
});

const { ofacGeoBlockApi: mockedOfacApi } = jest.requireMock(
  "@ledgerhq/live-common/api/ofacGeoBlockApi",
) as { ofacGeoBlockApi: { useCheckQuery: jest.Mock } };

function renderApp(currencyInitialized: boolean, overrideInitialState?: (state: State) => State) {
  return render(
    <WaitForAppReady currencyInitialized={currencyInitialized}>
      <Text>App is Ready</Text>
    </WaitForAppReady>,
    { overrideInitialState },
  );
}

describe("WaitForAppReady", () => {
  beforeEach(() => {
    mockedOfacApi.useCheckQuery.mockReturnValue({ isLoading: false });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when app is fully ready", () => {
    // Default test state: remoteFlagsReady=true; OFAC not loading; currency initialized
    renderApp(true);
    expect(screen.getByText("App is Ready")).toBeTruthy();
  });

  it("hides children while OFAC check is loading", () => {
    mockedOfacApi.useCheckQuery.mockReturnValue({ isLoading: true });
    renderApp(true);
    expect(screen.queryByText("App is Ready")).toBeNull();
  });

  it("hides children while remote flags have not settled", () => {
    renderApp(true, state => ({
      ...state,
      featureFlags: { ...state.featureFlags, remoteFlagsReady: false },
    }));
    expect(screen.queryByText("App is Ready")).toBeNull();
  });

  it("hides children while currency is not initialized", () => {
    renderApp(false);
    expect(screen.queryByText("App is Ready")).toBeNull();
  });
});
