import React from "react";
import { render } from "@tests/test-renderer";
import CryptoScreen from "../index";
import { ScreenName } from "~/const";
import { State } from "~/reducers/types";

const withAccounts = (state: State): State => ({
  ...state,
  accounts: {
    ...state.accounts,
    active: [{ id: "mock-account-1", type: "Account" } as never],
  },
});

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useFocusEffect: jest.fn(),
}));

const mockCategorizedAssets = jest.fn();

jest.mock("LLM/hooks/useCategorizedAssetsFromPortfolio", () => ({
  useCategorizedAssetsFromPortfolio: () => mockCategorizedAssets(),
}));

jest.mock("~/actions/general", () => ({
  ...jest.requireActual("~/actions/general"),
  useRefreshAccountsOrdering: () => jest.fn(),
}));

const makeCurrency = (name: string, id: string) => ({
  name,
  id,
  type: "CryptoCurrency",
  units: [{ code: id.toUpperCase(), magnitude: 8 }],
});

const makeCategorizedItem = (name: string, id: string) => ({
  currency: makeCurrency(name, id),
  balance: 100,
  value: 100,
  distribution: 0.5,
  accounts: [],
});

const emptyCategorizedAssets = () => ({
  categorizedAssets: { cryptos: [], stablecoins: [] },
  stablecoinTickers: new Set<string>(),
  isLoadingStablecoinTickers: false,
});

const makeRoute = (params?: Record<string, unknown>) => ({
  key: "Crypto",
  name: ScreenName.Crypto as const,
  params: {
    sourceScreenName: ScreenName.Portfolio,
    ...params,
  },
});

describe("CryptoScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCategorizedAssets.mockReturnValue(emptyCategorizedAssets());
  });

  it("should render 'Crypto' title when no variant is specified", () => {
    mockCategorizedAssets.mockReturnValue({
      ...emptyCategorizedAssets(),
      categorizedAssets: {
        cryptos: [makeCategorizedItem("Bitcoin", "bitcoin")],
        stablecoins: [],
      },
    });

    const { getByText } = render(
      <CryptoScreen route={makeRoute()} navigation={jest.fn() as never} />,
    );

    expect(getByText("Crypto")).toBeTruthy();
  });

  it("should render 'Crypto' title for variant crypto", () => {
    mockCategorizedAssets.mockReturnValue({
      ...emptyCategorizedAssets(),
      categorizedAssets: {
        cryptos: [makeCategorizedItem("Bitcoin", "bitcoin")],
        stablecoins: [],
      },
    });

    const { getByText } = render(
      <CryptoScreen route={makeRoute({ variant: "crypto" })} navigation={jest.fn() as never} />,
    );

    expect(getByText("Crypto")).toBeTruthy();
  });

  it("should render stablecoin title for variant stablecoin", () => {
    mockCategorizedAssets.mockReturnValue({
      ...emptyCategorizedAssets(),
      categorizedAssets: {
        cryptos: [],
        stablecoins: [makeCategorizedItem("Tether", "usdt")],
      },
    });

    const { getByText } = render(
      <CryptoScreen route={makeRoute({ variant: "stablecoin" })} navigation={jest.fn() as never} />,
    );

    expect(getByText("Stablecoin")).toBeTruthy();
  });

  describe("loading skeletons", () => {
    it("should render skeletons while stablecoin tickers are loading", () => {
      mockCategorizedAssets.mockReturnValue({
        ...emptyCategorizedAssets(),
        isLoadingStablecoinTickers: true,
      });

      const { getAllByTestId } = render(
        <CryptoScreen route={makeRoute()} navigation={jest.fn() as never} />,
        { overrideInitialState: withAccounts },
      );

      expect(getAllByTestId("crypto-list-item-skeleton").length).toBeGreaterThan(0);
    });

    it("should render skeletons when accounts exist but asset list is empty", () => {
      const { getAllByTestId } = render(
        <CryptoScreen route={makeRoute()} navigation={jest.fn() as never} />,
        { overrideInitialState: withAccounts },
      );

      expect(getAllByTestId("crypto-list-item-skeleton").length).toBeGreaterThan(0);
    });
  });
});
