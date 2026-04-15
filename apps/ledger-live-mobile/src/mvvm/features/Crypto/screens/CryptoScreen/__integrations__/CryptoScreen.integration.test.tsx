import React from "react";
import { render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import useCryptoViewModel from "../useCryptoViewModel";
import { CryptoScreenViewData } from "../types";

jest.mock("../useCryptoViewModel", () => jest.fn());

const mockedViewModel = jest.mocked(useCryptoViewModel);

const baseViewModel: CryptoScreenViewData = {
  assetsToDisplay: [],
  onItemPress: jest.fn(),
  isLoading: false,
  error: null,
  sourceScreenName: ScreenName.Portfolio,
  variant: "all",
  trackingType: undefined,
};

function renderScreen(vmOverrides: Partial<CryptoScreenViewData> = {}) {
  mockedViewModel.mockReturnValue({ ...baseViewModel, ...vmOverrides });

  const CryptoScreen = jest.requireActual("../index").default;

  return render(
    <CryptoScreen route={{ params: { sourceScreenName: ScreenName.Portfolio } }} navigation={{}} />,
  );
}

describe("CryptoScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loading state", () => {
    it("should render skeletons while loading", () => {
      renderScreen({ isLoading: true });
      expect(screen.getAllByTestId("crypto-list-item-skeleton").length).toBeGreaterThan(0);
    });

    it("should render the empty state when asset list is empty and not loading", () => {
      renderScreen({ isLoading: false, assetsToDisplay: [] });
      expect(screen.getByTestId("crypto-empty-state")).toBeVisible();
      expect(screen.queryByTestId("crypto-list-item-skeleton")).toBeNull();
    });
  });

  describe("error state", () => {
    it("should render the error state and hide skeletons when error is set", () => {
      renderScreen({ error: new Error("Failed to load assets") });
      expect(screen.getByTestId("crypto-error-state")).toBeVisible();
      expect(screen.queryByTestId("crypto-list-item-skeleton")).toBeNull();
    });
  });
});
