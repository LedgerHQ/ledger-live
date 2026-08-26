import { getEnv } from "@ledgerhq/live-env";
import { log } from "@ledgerhq/logs";
import network from "@ledgerhq/live-network";
import api from "./api";
import { getCryptoCurrencyById, getFiatCurrencyByTicker } from "../tests/currencies";
import type { TrackingPair } from "../types";

jest.mock("@ledgerhq/live-env");
jest.mock("@ledgerhq/logs");
jest.mock("@ledgerhq/live-network");

const mockedGetEnv = jest.mocked(getEnv);
const mockedLog = jest.mocked(log);
const mockedNetwork = jest.mocked(network);

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const usd = getFiatCurrencyByTicker("USD");
const eur = getFiatCurrencyByTicker("EUR");
const startDate = new Date("2026-01-01T00:00:00.000Z");

function pair(from: TrackingPair["from"], to: TrackingPair["to"] = usd): TrackingPair {
  return { from, to, startDate };
}

function requestUrl(callIndex: number): URL {
  const request = mockedNetwork.mock.calls[callIndex]?.[0] as { url: string } | undefined;
  if (!request) throw new Error(`No network request at index ${callIndex}`);
  return new URL(request.url);
}

describe("countervalues latest API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetEnv.mockReturnValue("https://countervalues.example.com");
  });

  it("should preserve pair order across target currency batches", async () => {
    mockedNetwork
      .mockResolvedValueOnce({
        data: { bitcoin: 80658, ethereum: 2471.2 },
        status: 200,
      })
      .mockResolvedValueOnce({ data: { bitcoin: 68250 }, status: 200 });

    const result = await api.fetchLatest([
      pair(bitcoin, usd),
      pair(ethereum, usd),
      pair(bitcoin, eur),
    ]);

    expect(result).toEqual([80658, 2471.2, 68250]);
    expect(requestUrl(0).searchParams.get("to")).toBe("USD");
    expect(requestUrl(0).searchParams.get("froms")).toBe("bitcoin,ethereum");
    expect(requestUrl(1).searchParams.get("to")).toBe("EUR");
    expect(requestUrl(1).searchParams.get("froms")).toBe("bitcoin");
    expect(mockedLog).not.toHaveBeenCalled();
  });

  it("should preserve undefined and log identifiers for incomplete batches", async () => {
    mockedNetwork.mockResolvedValue({ data: { bitcoin: 0 }, status: 200 });

    const result = await api.fetchLatest([pair(bitcoin), pair(ethereum)]);

    expect(result).toEqual([undefined, undefined]);
    expect(mockedLog).toHaveBeenCalledWith(
      "countervalues-error",
      "Incomplete latest rates batch: to=USD requested=bitcoin,ethereum missing=ethereum invalid=bitcoin",
    );
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, null, "80658"])(
    "should reject the invalid latest rate %p",
    async value => {
      mockedNetwork.mockResolvedValue({
        data: { bitcoin: value },
        status: 200,
      });

      await expect(api.fetchLatest([pair(bitcoin)])).resolves.toEqual([undefined]);
      expect(mockedLog).toHaveBeenCalledWith(
        "countervalues-error",
        "Incomplete latest rates batch: to=USD requested=bitcoin missing= invalid=bitcoin",
      );
    },
  );

  it("should not call the network for an empty pair list", async () => {
    await expect(api.fetchLatest([])).resolves.toEqual([]);
    expect(mockedNetwork).not.toHaveBeenCalled();
  });
});
