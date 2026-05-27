import React from "react";
import { render, renderWithReactQuery, screen, withFlagOverrides } from "@tests/test-renderer";
import { PortfolioEmptySection } from "../index";
import { State } from "~/reducers/types";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import {
  btcCurrency,
  ethCurrency,
  overrideInitialStateWithAssetSection,
  overrideInitialStateWithOnboardingWidgetVisible,
} from "../../../__integrations__/shared";
import { QUICK_ACTIONS_TEST_IDS } from "LLM/features/QuickActions/testIds";
import type { Account } from "@ledgerhq/types-live";

const mockNavigate = jest.fn();

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
  useAccountBridgeOrNull: jest.fn(),
  useAccountBridgeMany: jest.fn((accounts: Account[]) =>
    accounts.map(() => ({ isAccountEmpty: () => false })),
  ),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => ({
    name: "Portfolio",
  }),
}));

const createAccountState = withFlagOverrides(
  { lwmWallet40: { enabled: true, params: { assetSection: true } } },
  state => {
    const btcAccount = genAccount("btc-1", { currency: btcCurrency });
    const ethAccount = genAccount("eth-1", { currency: ethCurrency });

    return {
      ...state,
      accounts: {
        ...state.accounts,
        active: [btcAccount, ethAccount],
      },
    };
  },
);

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
      renderWithReactQuery(<PortfolioEmptySection isLNSUpsellBannerShown={false} />, {
        overrideInitialState: emptyAccountState,
      });

      expect(await screen.findByText(/add crypto account/i)).toBeVisible();
    });

    it("should render quick actions CTAs", () => {
      renderWithReactQuery(<PortfolioEmptySection isLNSUpsellBannerShown={false} />, {
        overrideInitialState: emptyAccountState,
      });

      expect(screen.getByTestId(QUICK_ACTIONS_TEST_IDS.ctas.container)).toBeVisible();
    });

    it("should open the add account drawer when pressing the add button", async () => {
      const { user } = renderWithReactQuery(
        <PortfolioEmptySection isLNSUpsellBannerShown={false} />,
        {
          overrideInitialState: emptyAccountState,
        },
      );

      const addButton = await screen.findByText(/add crypto account/i);
      await user.press(addButton);

      expect(await screen.findByTestId("modal-close-button")).toBeVisible();
    });

    it("should not display the cryptos section", () => {
      renderWithReactQuery(<PortfolioEmptySection isLNSUpsellBannerShown={false} />, {
        overrideInitialState: emptyAccountState,
      });

      expect(screen.queryByText(/see all assets/i)).toBeNull();
    });

    it("should render portfolio banners section", () => {
      renderWithReactQuery(<PortfolioEmptySection isLNSUpsellBannerShown={false} />, {
        overrideInitialState: overrideInitialStateWithOnboardingWidgetVisible,
      });

      expect(screen.getAllByTestId("portfolio-banners-section").length).toBeGreaterThan(0);
    });
  });

  describe("when user has accounts (NoSignerContent)", () => {
    it("should render the cryptos section with assets", async () => {
      renderWithReactQuery(<PortfolioEmptySection isLNSUpsellBannerShown={false} />, {
        overrideInitialState: createAccountState,
      });

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
    });

    it("should render the read-only coins fallback when assetSection flag is off", async () => {
      renderWithReactQuery(<PortfolioEmptySection isLNSUpsellBannerShown={false} />, {
        overrideInitialState: overrideInitialStateWithAssetSection(false),
      });

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
    });

    it("should render quick actions CTAs", () => {
      render(<PortfolioEmptySection isLNSUpsellBannerShown={false} />, {
        overrideInitialState: createAccountState,
      });

      expect(screen.getByTestId(QUICK_ACTIONS_TEST_IDS.ctas.container)).toBeVisible();
    });

    it("should not display the add account button", () => {
      render(<PortfolioEmptySection isLNSUpsellBannerShown={false} />, {
        overrideInitialState: createAccountState,
      });

      expect(screen.queryByText(/add crypto account/i)).toBeNull();
    });

    it("should display the portfolio banners section", () => {
      renderWithReactQuery(<PortfolioEmptySection isLNSUpsellBannerShown={false} />, {
        overrideInitialState: state =>
          overrideInitialStateWithOnboardingWidgetVisible(createAccountState(state)),
      });

      expect(screen.getAllByTestId("portfolio-banners-section").length).toBeGreaterThan(0);
    });
  });
});
