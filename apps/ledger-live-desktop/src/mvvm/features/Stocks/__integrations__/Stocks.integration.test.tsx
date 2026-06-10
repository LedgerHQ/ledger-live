import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import { useStocksData } from "@ledgerhq/live-common/dada-client/hooks/useStocksData";
import Stocks from "..";

jest.mock("@ledgerhq/live-common/dada-client/hooks/useStocksData");

const mockedUseStocksData = jest.mocked(useStocksData);

type MetaInput = {
  id: string;
  name: string;
  ticker: string;
  ledgerId?: string;
  marketId?: string;
};

function buildStocksData(metas: MetaInput[]) {
  const cryptoAssets: Record<string, unknown> = {};
  const cryptoOrTokenCurrencies: Record<string, unknown> = {};
  const markets: Record<string, unknown> = {};
  const metaCurrencyIds: string[] = [];

  metas.forEach(({ id, name, ticker, ledgerId, marketId }) => {
    cryptoAssets[id] = { id, name, ticker, assetsIds: ledgerId ? { solana: ledgerId } : {} };
    if (ledgerId) {
      cryptoOrTokenCurrencies[ledgerId] = { id: ledgerId, type: "TokenCurrency", name, ticker };
      markets[ledgerId] = { id: marketId, currencyId: ledgerId, price: 1, marketCap: 1 };
    }
    metaCurrencyIds.push(id);
  });

  return {
    cryptoAssets,
    networks: {},
    cryptoOrTokenCurrencies,
    interestRates: {},
    markets,
    currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds },
    pagination: {},
  };
}

function mockStocksData({
  metas,
  isLoading = false,
}: {
  metas?: MetaInput[];
  isLoading?: boolean;
}) {
  mockedUseStocksData.mockReturnValue({
    data: metas ? buildStocksData(metas) : undefined,
    isLoading,
  } as unknown as ReturnType<typeof useStocksData>);
}

const APPLE = {
  id: "urn:crypto:meta-currency:applex",
  name: "Apple xStock",
  ticker: "AAPLX",
  ledgerId: "solana/spl/applex",
  marketId: "apple-xstock",
};
const TESLA = {
  id: "urn:crypto:meta-currency:teslax",
  name: "Tesla xStock",
  ticker: "TSLAX",
  ledgerId: "solana/spl/teslax",
};
const NVIDIA = {
  id: "urn:crypto:meta-currency:nvidiax",
  name: "Nvidia xStock",
  ticker: "NVDAX",
  ledgerId: "solana/spl/nvidiax",
};

describe("Stocks section", () => {
  const navigateToAsset = jest.fn();
  const onSeeAll = jest.fn();

  afterEach(() => jest.clearAllMocks());

  it("renders the top stocks in market-cap order, capped to the limit", () => {
    mockStocksData({ metas: [APPLE, TESLA, NVIDIA] });

    render(<Stocks limit={2} navigateToAsset={navigateToAsset} onSeeAll={onSeeAll} />);

    expect(screen.getByTestId("stocks-section")).toBeVisible();
    expect(screen.getByTestId("stocks-list")).toBeVisible();
    expect(screen.getByTestId("stock-item-ticker-aaplx")).toBeVisible();
    expect(screen.getByTestId("stock-item-ticker-tslax")).toBeVisible();
    expect(screen.queryByTestId("stock-item-ticker-nvdax")).not.toBeInTheDocument();
  });

  it("shows skeleton rows while loading", () => {
    mockStocksData({ isLoading: true });

    render(<Stocks limit={2} navigateToAsset={navigateToAsset} onSeeAll={onSeeAll} />);

    expect(screen.getByTestId("stocks-skeleton")).toBeVisible();
  });

  it("hides the section when there are no stocks", () => {
    mockStocksData({ metas: [] });

    render(<Stocks limit={2} navigateToAsset={navigateToAsset} onSeeAll={onSeeAll} />);

    expect(screen.queryByTestId("stocks-section")).not.toBeInTheDocument();
  });

  it("navigates to the asset detail when a row is clicked", () => {
    mockStocksData({ metas: [APPLE] });

    render(<Stocks limit={2} navigateToAsset={navigateToAsset} onSeeAll={onSeeAll} />);

    fireEvent.click(screen.getByTestId("stock-item-ticker-aaplx"));
    expect(navigateToAsset).toHaveBeenCalledWith(APPLE.marketId);
  });

  it("navigates using the meta-currency slug when DADA omits the market id", () => {
    mockStocksData({ metas: [TESLA] });

    render(<Stocks limit={2} navigateToAsset={navigateToAsset} onSeeAll={onSeeAll} />);

    fireEvent.click(screen.getByTestId("stock-item-ticker-tslax"));
    expect(navigateToAsset).toHaveBeenCalledWith("teslax");
  });

  it("skips stocks that have no ledger id", () => {
    mockStocksData({
      metas: [{ id: "urn:crypto:meta-currency:noledger", name: "No Ledger", ticker: "NOLX" }],
    });

    render(<Stocks limit={2} navigateToAsset={navigateToAsset} onSeeAll={onSeeAll} />);

    expect(screen.queryByTestId("stocks-section")).not.toBeInTheDocument();
  });

  it("backfills the limit with the next valid stock when some entries have no ledger id", () => {
    mockStocksData({
      metas: [
        { id: "urn:crypto:meta-currency:noledger", name: "No Ledger", ticker: "NOLX" },
        APPLE,
        TESLA,
        NVIDIA,
      ],
    });

    render(<Stocks limit={2} navigateToAsset={navigateToAsset} onSeeAll={onSeeAll} />);

    expect(screen.getByTestId("stock-item-ticker-aaplx")).toBeVisible();
    expect(screen.getByTestId("stock-item-ticker-tslax")).toBeVisible();
    expect(screen.queryByTestId("stock-item-ticker-nvdax")).not.toBeInTheDocument();
  });

  it("triggers the see-all handler from the section header", () => {
    mockStocksData({ metas: [APPLE] });

    render(<Stocks limit={2} navigateToAsset={navigateToAsset} onSeeAll={onSeeAll} />);

    fireEvent.click(screen.getByTestId("stocks-see-all"));
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it("renders an Explore link instead of the show-more header", () => {
    mockStocksData({ metas: [APPLE] });

    render(
      <Stocks
        limit={2}
        headerVariant="explore"
        navigateToAsset={navigateToAsset}
        onSeeAll={onSeeAll}
      />,
    );

    expect(screen.getByTestId("stocks-explore")).toBeVisible();
    expect(screen.queryByTestId("stocks-see-all")).not.toBeInTheDocument();
  });

  it("triggers the see-all handler from the Explore link", () => {
    mockStocksData({ metas: [APPLE] });

    render(
      <Stocks
        limit={2}
        headerVariant="explore"
        navigateToAsset={navigateToAsset}
        onSeeAll={onSeeAll}
      />,
    );

    fireEvent.click(screen.getByTestId("stocks-explore"));
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });
});
