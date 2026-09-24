import React from "react";
import { render, renderWithReactQuery, screen, withFlagOverrides } from "@tests/test-renderer";
import { PortfolioEmptySection } from "../index";
import { State } from "~/reducers/types";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { DeviceModelId } from "@ledgerhq/types-devices";
import subDays from "date-fns/subDays";
import { QUICK_ACTIONS_TEST_IDS } from "LLM/features/QuickActions/testIds";
import type { Account } from "@ledgerhq/types-live";

// Not imported from Portfolio's `__integrations__/shared`: it pulls the full Portfolio screens (~1s of imports).
const btcCurrency = getCryptoCurrencyById("bitcoin");
const ethCurrency = getCryptoCurrencyById("ethereum");

const readOnlyCoinsFallbackState = withFlagOverrides(
  { lwmWallet40: { params: { assetSection: false } } },
  state => ({
    ...state,
    accounts: { active: [{ ...genAccount("perpsAccount", { currency: btcCurrency }), index: 0 }] },
  }),
);

const onboardingWidgetVisibleState = withFlagOverrides(
  { onboardingWidget: { enabled: true } },
  (state: State): State => ({
    ...state,
    postOnboarding: {
      ...state.postOnboarding,
      deviceModelId: DeviceModelId.nanoX,
      walletEntryPointEligibleForPortfolio: true,
    },
    settings: {
      ...state.settings,
      hasCompletedOnboarding: true,
      onboardingCompletionDate: subDays(new Date(), 2).toISOString(),
    },
  }),
);

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
  { lwmWallet40: { params: { assetSection: true } } },
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
    it("should render an add account button and quick actions CTAs, without the cryptos section", async () => {
      renderWithReactQuery(<PortfolioEmptySection isLNUpsellBannerShown={false} />, {
        overrideInitialState: emptyAccountState,
      });

      expect(screen.getByTestId(QUICK_ACTIONS_TEST_IDS.ctas.container)).toBeVisible();
      expect(screen.queryByText(/see all assets/i)).toBeNull();
      expect(await screen.findByText(/add crypto account/i)).toBeVisible();
    });

    it("should open the add account drawer when pressing the add button", async () => {
      const { user } = renderWithReactQuery(
        <PortfolioEmptySection isLNUpsellBannerShown={false} />,
        {
          overrideInitialState: emptyAccountState,
        },
      );

      const addButton = await screen.findByText(/add crypto account/i);
      await user.press(addButton);

      expect(await screen.findByTestId("modal-close-button")).toBeVisible();
    });

    it("should render portfolio banners section", () => {
      renderWithReactQuery(<PortfolioEmptySection isLNUpsellBannerShown={false} />, {
        overrideInitialState: onboardingWidgetVisibleState,
      });

      expect(screen.getAllByTestId("portfolio-banners-section").length).toBeGreaterThan(0);
    });
  });

  describe("when user has accounts (NoSignerContent)", () => {
    it("should render the cryptos section with assets", async () => {
      renderWithReactQuery(<PortfolioEmptySection isLNUpsellBannerShown={false} />, {
        overrideInitialState: createAccountState,
      });

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
    });

    it("should render the read-only coins fallback when assetSection flag is off", async () => {
      renderWithReactQuery(<PortfolioEmptySection isLNUpsellBannerShown={false} />, {
        overrideInitialState: readOnlyCoinsFallbackState,
      });

      expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
    });

    it("should render quick actions CTAs without the add account button", () => {
      render(<PortfolioEmptySection isLNUpsellBannerShown={false} />, {
        overrideInitialState: createAccountState,
      });

      expect(screen.getByTestId(QUICK_ACTIONS_TEST_IDS.ctas.container)).toBeVisible();
      expect(screen.queryByText(/add crypto account/i)).toBeNull();
    });

    it("should display the portfolio banners section", () => {
      renderWithReactQuery(<PortfolioEmptySection isLNUpsellBannerShown={false} />, {
        overrideInitialState: state => onboardingWidgetVisibleState(createAccountState(state)),
      });

      expect(screen.getAllByTestId("portfolio-banners-section").length).toBeGreaterThan(0);
    });
  });
});
