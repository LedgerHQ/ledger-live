import { renderHook, waitFor } from "tests/testSetup";
import { server } from "tests/server";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { mockMarket, mockDada } from "tests/utils/assetDetailMocks";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useAssetDetailViewModel } from "../useAssetDetailViewModel";
import type { AssetDetailReady } from "../../types";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useParams: jest.fn(),
  useLocation: jest.fn(() => ({ state: null, pathname: "/asset/x", search: "", hash: "" })),
}));

jest.mock("~/renderer/actions/general", () => ({
  ...jest.requireActual("~/renderer/actions/general"),
  useDistribution: jest.fn(),
}));

const { useParams, useLocation } = jest.requireMock("react-router");
const { useDistribution } = jest.requireMock("~/renderer/actions/general");

const btc = getCryptoCurrencyById("bitcoin");

const route = (
  routeId: string | undefined,
  distribution: { bySlug?: Record<string, DistributionItem>; list?: DistributionItem[] } = {},
) => {
  useParams.mockReturnValue({ "*": routeId });
  useDistribution.mockReturnValue({
    bySlug: distribution.bySlug ?? {},
    list: distribution.list ?? [],
    isLoading: false,
  });
};

const locationState = (state: unknown) =>
  useLocation.mockReturnValue({ state, pathname: "/asset/x", search: "", hash: "" });

const renderVM = () =>
  renderHook(() => useAssetDetailViewModel(), {
    initialState: { settings: { counterValue: "USD" } },
  });

function assertReady(
  vm: ReturnType<typeof useAssetDetailViewModel>,
): asserts vm is AssetDetailReady {
  if (vm.mode !== "ready") throw new Error(`Expected ready, got ${vm.mode}`);
}

const waitForReady = async (): Promise<AssetDetailReady> => {
  const { result } = renderVM();
  await waitFor(() => expect(result.current.mode).toBe("ready"));
  assertReady(result.current);
  return result.current;
};

describe("useAssetDetailViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    locationState(null);
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe("mode", () => {
    it("returns ready while Market is pending when the route identifies an asset", () => {
      mockMarket.hang();
      route("unknown");

      const { result } = renderVM();
      expect(result.current.mode).toBe("ready");
      if (result.current.mode === "ready") {
        expect(result.current.marketData.isLoading).toBe(true);
        expect(result.current.distributionItem).toBeUndefined();
      }
    });

    it("returns not-found when Market settled empty and DADA fails", async () => {
      mockMarket.empty();
      mockDada.fail();
      route("unknown");

      const { result } = renderVM();
      await waitFor(() => expect(result.current.mode).toBe("not-found"));
    });

    it("returns not-found when route param is undefined", async () => {
      mockMarket.empty();
      route(undefined);

      const { result } = renderVM();
      await waitFor(() => expect(result.current.mode).toBe("not-found"));
    });
  });

  describe("distributionItem resolution", () => {
    it("wires distribution resolution correctly", async () => {
      const item = buildDistributionItem({ currency: btc });
      route("bitcoin", { bySlug: { bitcoin: item } });

      expect((await waitForReady()).distributionItem).toBe(item);
    });
  });

  describe("market data source priority", () => {
    beforeEach(() => {
      route("bitcoin", { bySlug: { bitcoin: buildDistributionItem({ currency: btc }) } });
    });

    it("prefers DADA market data over marketFromHook", async () => {
      mockMarket.withData([
        { id: "bitcoin", ledgerIds: ["bitcoin"], name: "Bitcoin Hook", price: 1 },
      ]);
      mockDada.withMarkets({
        bitcoin: { id: "bitcoin", ledgerIds: ["bitcoin"], name: "Bitcoin DADA", price: 2 },
      });

      const { result } = renderVM();
      await waitFor(() => expect(result.current.mode).toBe("ready"));
      assertReady(result.current);
      await waitFor(() => {
        assertReady(result.current);
        expect(result.current.marketData.marketCurrencyData?.name).toBe("Bitcoin DADA");
      });
    });

    it("falls back to marketFromHook when DADA has no market entry", async () => {
      mockMarket.withData([
        { id: "bitcoin", ledgerIds: ["bitcoin"], name: "Bitcoin Hook", price: 1 },
      ]);
      mockDada.empty();

      const { result } = renderVM();
      await waitFor(() => {
        assertReady(result.current);
        expect(result.current.marketData.marketCurrencyData?.name).toBe("Bitcoin Hook");
      });
    });

    it("falls back to location.state when DADA and marketFromHook are empty", async () => {
      mockMarket.empty();
      mockDada.empty();
      route("bitcoin");
      locationState({ id: "bitcoin", ledgerIds: ["bitcoin"], name: "Bitcoin Seed", price: 9 });

      expect((await waitForReady()).displayName).toBe("Bitcoin Seed");
    });
  });

  describe("ready state shape", () => {
    it("uses distributionItem.currency for name, ticker and ledgerCurrency", async () => {
      route("bitcoin", { bySlug: { bitcoin: buildDistributionItem({ currency: btc }) } });

      const vm = await waitForReady();

      expect(vm.displayName).toBe(btc.name);
      expect(vm.displayTicker).toBe(btc.ticker);
      expect(vm.ledgerCurrency).toBe(btc);
      expect(vm.ledgerId).toBe(btc.id);
    });

    it("falls back to marketCurrencyData for name/ticker in discovery mode", async () => {
      mockMarket.withData([
        { id: "bitcoin", ledgerIds: ["bitcoin"], name: "Bitcoin", ticker: "BTC", price: 100 },
      ]);
      mockDada.empty();
      route("bitcoin");

      const { result } = renderVM();

      await waitFor(() => {
        assertReady(result.current);
        expect(result.current.displayName).toBe("Bitcoin");
        expect(result.current.displayTicker).toBe("BTC");
      });
    });

    it("falls back to empty strings when neither source provides name/ticker", async () => {
      mockMarket.withData([{ id: "bitcoin", ledgerIds: ["bitcoin"], price: 100 }]);
      mockDada.empty();
      route("bitcoin");

      const vm = await waitForReady();

      expect(vm.displayName).toBe("");
      expect(vm.displayTicker).toBe("");
    });

    it("derives ledgerCurrency from DADA assetData in discovery mode", async () => {
      mockMarket.withData([{ id: "bitcoin", ledgerIds: ["bitcoin"], name: "Bitcoin" }]);
      route("bitcoin");

      const { result } = renderVM();

      await waitFor(() => {
        assertReady(result.current);
        expect(result.current.ledgerCurrency?.id).toBe(btc.id);
      });
    });

    it("exposes the resolved market dataset under viewModel.marketData for MarketDataSection", async () => {
      mockMarket.withData([
        { id: "bitcoin", ledgerIds: ["bitcoin"], name: "Bitcoin Hook", ticker: "BTC", price: 1 },
      ]);
      mockDada.empty();
      route("bitcoin", { bySlug: { bitcoin: buildDistributionItem({ currency: btc }) } });

      const { result } = renderVM();
      await waitFor(() => expect(result.current.mode).toBe("ready"));
      await waitFor(() => {
        assertReady(result.current);
        expect(result.current.marketData.marketCurrencyData?.name).toBe("Bitcoin Hook");
        expect(result.current.marketData.isLoading).toBe(false);
      });
    });
  });
});
