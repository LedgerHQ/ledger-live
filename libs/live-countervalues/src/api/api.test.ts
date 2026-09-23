import type { Currency } from "@ledgerhq/ledger-wallet-framework/types";
import { getCryptoCurrencyById, getFiatCurrencyByTicker } from "../tests/currencies";
import type { TrackingPair } from "../types";

const network = jest.fn();
jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: (...args: unknown[]) => network(...args),
}));

import api from "./api";

describe("fetchLatest", () => {
  const bitcoin = getCryptoCurrencyById("bitcoin");
  const ethereum = getCryptoCurrencyById("ethereum");
  const usd = getFiatCurrencyByTicker("USD");

  // resolveTrackingPairs sorts by pairId, which is "<to> <from>", so bitcoin comes first
  const pairs: TrackingPair[] = [
    { from: bitcoin, to: usd, startDate: new Date() },
    { from: ethereum, to: usd, startDate: new Date() },
  ];

  const notBitcoin = (c: Currency) => c.type !== "FiatCurrency" && c.id !== "bitcoin";

  beforeEach(() => {
    network.mockReset();
    network.mockImplementation(({ url }: { url: string }) => {
      const froms = new URL(url).searchParams.get("froms")?.split(",") ?? [];
      return Promise.resolve({ data: Object.fromEntries(froms.map((f, i) => [f, i + 1])) });
    });
  });

  function requestedFroms(): string[] {
    return network.mock.calls
      .map(([{ url }]: [{ url: string }]) => new URL(url).searchParams.get("froms") as string)
      .sort();
  }

  it("keeps the first pair out of the batch when its currency must not be batched", async () => {
    await api.fetchLatest(pairs, { shouldBatchCurrencyFrom: notBitcoin });

    expect(requestedFroms()).toEqual(["bitcoin", "ethereum"]);
  });

  it("batches the first pair when its currency may be batched", async () => {
    await api.fetchLatest(pairs, { shouldBatchCurrencyFrom: () => true });

    expect(requestedFroms()).toEqual(["bitcoin,ethereum"]);
  });

  it("returns the rates in the order of the requested pairs", async () => {
    network.mockImplementation(({ url }: { url: string }) => {
      const froms = new URL(url).searchParams.get("froms")?.split(",") ?? [];
      return Promise.resolve({
        data: Object.fromEntries(froms.map(f => [f, f === "bitcoin" ? 50000 : 3000])),
      });
    });

    await expect(api.fetchLatest(pairs, { shouldBatchCurrencyFrom: notBitcoin })).resolves.toEqual([
      50000, 3000,
    ]);
  });

  it("requests nothing for an empty pair list", async () => {
    await expect(api.fetchLatest([], { shouldBatchCurrencyFrom: () => true })).resolves.toEqual([]);
    expect(network).not.toHaveBeenCalled();
  });
});
