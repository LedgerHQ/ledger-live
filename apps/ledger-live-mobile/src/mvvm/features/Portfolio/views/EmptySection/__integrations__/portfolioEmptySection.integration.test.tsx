import React from "react";
import { render, renderWithReactQuery, screen } from "@tests/test-renderer";
import { PortfolioEmptySection } from "../index";
import { State } from "~/reducers/types";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import {
  btcCurrency,
  ethCurrency,
  overrideInitialStateWithAssetSection,
} from "../../../__integrations__/shared";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => ({
    name: "Portfolio",
  }),
}));

const createAccountState = (state: State): State => {
  const btcAccount = genAccount("btc-1", { currency: btcCurrency });
  const ethAccount = genAccount("eth-1", { currency: ethCurrency });

  return {
    ...state,
    accounts: {
      ...state.accounts,
      active: [btcAccount, ethAccount],
    },
    settings: {
      ...state.settings,
      overriddenFeatureFlags: {
        ...state.settings.overriddenFeatureFlags,
        lwmWallet40: { enabled: true, params: { assetSection: true } },
      },
    },
  };
};

const emptyAccountState = (state: State): State => ({
  ...state,
  accounts: {
    ...state.accounts,
    active: [],
  },
});

describe("PortfolioEmptySection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when user has no accounts (NoAccountsContent)", () => {
    it("should render an add account button", async () => {
      renderWithReactQuery(<PortfolioEmptySection />, {
        overrideInitialState: emptyAccountState,
      });

      expect(await screen.findByText(/add crypto account/i)).toBeVisible();
    });

    it("should open the add account drawer when pressing the add button", async () => {
      const { user } = renderWithReactQuery(<PortfolioEmptySection />, {
        overrideInitialState: emptyAccountState,
      });

      const addButton = await screen.findByText(/add crypto account/i);
      await user.press(addButton);

      expect(await screen.findByTestId("modal-close-button")).toBeVisible();
    });

    it("should not display the see all assets button", () => {
      renderWithReactQuery(<PortfolioEmptySection />, {
        overrideInitialState: emptyAccountState,
      });

      expect(screen.queryByText(/see all assets/i)).toBeNull();
    });
  });

  describe("when user has accounts (NoSignerContent)", () => {
    it("should render the cryptos section with assets", async () => {
      renderWithReactQuery(<PortfolioEmptySection />, {
        overrideInitialState: createAccountState,
      });

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
    });

    it("should render the read-only coins fallback when assetSection flag is off", async () => {
      renderWithReactQuery(<PortfolioEmptySection />, {
        overrideInitialState: overrideInitialStateWithAssetSection(false),
      });

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
    });

    it("should not display the add account button", () => {
      render(<PortfolioEmptySection />, {
        overrideInitialState: createAccountState,
      });

      expect(screen.queryByText(/add crypto account/i)).toBeNull();
    });
  });
});
