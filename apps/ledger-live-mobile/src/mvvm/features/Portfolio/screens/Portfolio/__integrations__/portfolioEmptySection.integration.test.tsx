import React from "react";
import { render, renderWithReactQuery, screen } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import {
  btcCurrency,
  ethCurrency,
  overrideInitialStateWithAssetSection,
} from "../../../__integrations__/shared";
import { QUICK_ACTIONS_TEST_IDS } from "LLM/features/QuickActions/testIds";
import { PortfolioNoAccountsView } from "../views/PortfolioNoAccountsView";
import { PortfolioNoSignerView } from "../views/PortfolioNoSignerView";

const mockNavigate = jest.fn();
const mockOpenAddModal = jest.fn();

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

describe("PortfolioNoAccountsView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render an add account button", async () => {
    renderWithReactQuery(
      <PortfolioNoAccountsView
        isLNSUpsellBannerShown={false}
        shouldDisplayAssetSection={false}
        openAddModal={mockOpenAddModal}
      />,
      { overrideInitialState: emptyAccountState },
    );

    expect(await screen.findByText(/add crypto account/i)).toBeVisible();
  });

  it("should render quick actions CTAs", () => {
    renderWithReactQuery(
      <PortfolioNoAccountsView
        isLNSUpsellBannerShown={false}
        shouldDisplayAssetSection={false}
        openAddModal={mockOpenAddModal}
      />,
      { overrideInitialState: emptyAccountState },
    );

    expect(screen.getByTestId(QUICK_ACTIONS_TEST_IDS.ctas.container)).toBeVisible();
  });

  it("should call openAddModal when pressing the add button", async () => {
    const { user } = renderWithReactQuery(
      <PortfolioNoAccountsView
        isLNSUpsellBannerShown={false}
        shouldDisplayAssetSection={false}
        openAddModal={mockOpenAddModal}
      />,
      { overrideInitialState: emptyAccountState },
    );

    const addButton = await screen.findByText(/add crypto account/i);
    await user.press(addButton);

    expect(mockOpenAddModal).toHaveBeenCalledTimes(1);
  });

  it("should not display the cryptos section when shouldDisplayAssetSection is false", () => {
    renderWithReactQuery(
      <PortfolioNoAccountsView
        isLNSUpsellBannerShown={false}
        shouldDisplayAssetSection={false}
        openAddModal={mockOpenAddModal}
      />,
      { overrideInitialState: emptyAccountState },
    );

    expect(screen.queryByText(/see all assets/i)).toBeNull();
  });

  it("should render portfolio banners section", () => {
    renderWithReactQuery(
      <PortfolioNoAccountsView
        isLNSUpsellBannerShown={false}
        shouldDisplayAssetSection={false}
        openAddModal={mockOpenAddModal}
      />,
      { overrideInitialState: emptyAccountState },
    );

    expect(screen.getAllByTestId("portfolio-banners-section").length).toBeGreaterThan(0);
  });
});

describe("PortfolioNoSignerView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the cryptos section with assets", async () => {
    renderWithReactQuery(
      <PortfolioNoSignerView
        isLNSUpsellBannerShown={false}
        shouldDisplayAssetSection
      />,
      { overrideInitialState: createAccountState },
    );

    expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
  });

  it("should render the read-only coins fallback when assetSection flag is off", async () => {
    renderWithReactQuery(
      <PortfolioNoSignerView
        isLNSUpsellBannerShown={false}
        shouldDisplayAssetSection={false}
      />,
      { overrideInitialState: overrideInitialStateWithAssetSection(false) },
    );

    expect(await screen.findByTestId("PortfolioCryptosList")).toBeVisible();
  });

  it("should render quick actions CTAs", () => {
    render(
      <PortfolioNoSignerView
        isLNSUpsellBannerShown={false}
        shouldDisplayAssetSection
      />,
      { overrideInitialState: createAccountState },
    );

    expect(screen.getByTestId(QUICK_ACTIONS_TEST_IDS.ctas.container)).toBeVisible();
  });

  it("should not display the add account button", () => {
    render(
      <PortfolioNoSignerView
        isLNSUpsellBannerShown={false}
        shouldDisplayAssetSection
      />,
      { overrideInitialState: createAccountState },
    );

    expect(screen.queryByText(/add crypto account/i)).toBeNull();
  });

  it("should display the portfolio banners section", () => {
    render(
      <PortfolioNoSignerView
        isLNSUpsellBannerShown={false}
        shouldDisplayAssetSection
      />,
      { overrideInitialState: createAccountState },
    );

    expect(screen.getAllByTestId("portfolio-banners-section").length).toBeGreaterThan(0);
  });
});
