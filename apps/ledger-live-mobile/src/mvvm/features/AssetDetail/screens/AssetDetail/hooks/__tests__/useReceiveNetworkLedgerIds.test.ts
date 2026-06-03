import { renderHook, waitFor } from "@tests/test-renderer";
import { mockData } from "@ledgerhq/live-common/modularDrawer/__mocks__/dada.mock";
import { useReceiveNetworkLedgerIds } from "../useReceiveNetworkLedgerIds";

const TETHER_META_ID = "urn:crypto:meta-currency:tether";
const TETHER_NETWORK_LEDGER_IDS = Object.values(mockData.cryptoAssets[TETHER_META_ID].assetsIds);
const SINGLE_USDT_ID = "ethereum/erc20/usd_tether__erc20_";

describe("useReceiveNetworkLedgerIds", () => {
  describe("token expansion", () => {
    it("expands a token meta-currency to all of its network ledger ids", async () => {
      const { result } = renderHook(() =>
        useReceiveNetworkLedgerIds({
          metaCurrencyId: TETHER_META_ID,
          ticker: "USDT",
          fallbackLedgerIds: [SINGLE_USDT_ID],
        }),
      );

      await waitFor(() => expect(result.current.length).toBeGreaterThan(1));

      expect(result.current).toEqual(TETHER_NETWORK_LEDGER_IDS);
      expect(result.current).toContain("tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t");
    });

    it("expands when the fallback holds only a partial multi-network list", async () => {
      // CoinGecko can surface a partial subset (here 2 of the tether networks);
      // DADA still knows the full list, so we must expand rather than trust it.
      const partialFallback = [SINGLE_USDT_ID, "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t"];
      const { result } = renderHook(() =>
        useReceiveNetworkLedgerIds({
          metaCurrencyId: TETHER_META_ID,
          ticker: "USDT",
          fallbackLedgerIds: partialFallback,
        }),
      );

      await waitFor(() => expect(result.current.length).toBeGreaterThan(partialFallback.length));

      expect(result.current).toEqual(TETHER_NETWORK_LEDGER_IDS);
    });
  });

  describe("fallback", () => {
    it("returns the fallback when no meta-currency is provided", () => {
      const fallback = [SINGLE_USDT_ID];
      const { result } = renderHook(() =>
        useReceiveNetworkLedgerIds({
          metaCurrencyId: undefined,
          ticker: "USDT",
          fallbackLedgerIds: fallback,
        }),
      );

      expect(result.current).toEqual(fallback);
    });

    it("keeps the fallback when the catalog does not expand the asset to multiple networks", async () => {
      const fallback = ["dogecoin"];
      const { result } = renderHook(() =>
        useReceiveNetworkLedgerIds({
          metaCurrencyId: TETHER_META_ID,
          ticker: "DOGE",
          fallbackLedgerIds: fallback,
        }),
      );

      // The DOGE search never yields the tether meta, so the list stays the fallback.
      await waitFor(() => expect(result.current).toEqual(fallback));
      expect(result.current).toEqual(fallback);
    });
  });
});
