import { validateAssetsResponse } from "./validate";
import type { RawApiResponse } from "../schema";

const asset = (id: string) => ({ id, ticker: id.toUpperCase(), name: id, assetsIds: {} });
const rate = (currencyId: string) => ({
  currencyId,
  rate: 0.04,
  type: "APY",
  fetchAt: "2026-01-01T00:00:00.000Z",
});

function response(overrides: Partial<RawApiResponse> = {}): RawApiResponse {
  return {
    cryptoAssets: { btc: asset("btc") },
    networks: { ethereum: { id: "ethereum", name: "Ethereum" } },
    cryptoOrTokenCurrencies: {},
    interestRates: { ethereum: rate("ethereum") },
    markets: {},
    currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: ["btc"] },
    ...overrides,
  } as RawApiResponse;
}

let warn: jest.SpyInstance;

beforeEach(() => {
  warn = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

describe("validateAssetsResponse", () => {
  it("returns a well-formed response unchanged and warns about nothing", () => {
    const input = response();

    expect(validateAssetsResponse(input)).toEqual(input);
    expect(warn).not.toHaveBeenCalled();
  });

  it("keeps the valid siblings when one asset is malformed", () => {
    const result = validateAssetsResponse(
      response({
        cryptoAssets: {
          btc: asset("btc"),
          broken: { id: 42, ticker: "BAD" },
          eth: asset("eth"),
        } as unknown as RawApiResponse["cryptoAssets"],
      }),
    );

    expect(Object.keys(result.cryptoAssets)).toEqual(["btc", "eth"]);
  });

  it("returns an empty collection rather than failing when every item is invalid", () => {
    const result = validateAssetsResponse(
      response({
        interestRates: { a: { rate: "nope" }, b: {} } as unknown as RawApiResponse["interestRates"],
      }),
    );

    expect(result.interestRates).toEqual({});
    expect(result.cryptoAssets).not.toEqual({});
  });

  /* DADA adds fields; zod's default object mode would strip them back out. */
  it("preserves fields it does not model", () => {
    const result = validateAssetsResponse(
      response({
        cryptoAssets: {
          btc: { ...asset("btc"), marketCap: 123, nested: { a: 1 } },
        } as unknown as RawApiResponse["cryptoAssets"],
      }),
    );

    expect(result.cryptoAssets.btc).toMatchObject({ marketCap: 123, nested: { a: 1 } });
  });

  it("drops an unusable network without touching the others", () => {
    const result = validateAssetsResponse(
      response({
        networks: {
          ethereum: { id: "ethereum", name: "Ethereum" },
          bad: { name: "no id" },
        } as unknown as RawApiResponse["networks"],
      }),
    );

    expect(Object.keys(result.networks)).toEqual(["ethereum"]);
  });

  it("falls back to no server ordering when currenciesOrder is unusable", () => {
    const result = validateAssetsResponse(
      response({
        currenciesOrder: { key: "marketCap" } as unknown as RawApiResponse["currenciesOrder"],
      }),
    );

    expect(result.currenciesOrder).toEqual({ key: "", order: "", metaCurrencyIds: [] });
  });

  it("reports how many items each collection lost", () => {
    validateAssetsResponse(
      response({
        cryptoAssets: {
          ok: asset("ok"),
          bad: {},
          alsoBad: {},
        } as unknown as RawApiResponse["cryptoAssets"],
        networks: { bad: {} } as unknown as RawApiResponse["networks"],
      }),
    );

    expect(warn).toHaveBeenCalledTimes(1);
    const [message] = warn.mock.calls[0] as [string];
    expect(message).toContain("dropped 3");
    expect(message).toContain("cryptoAssets=2");
    expect(message).toContain("networks=1");
  });

  it.each([
    ["missing", undefined],
    ["a number", 1234],
    ["not a date", "nope"],
  ])("keeps a rate whose fetchAt is %s, since nothing reads it", (_label, fetchAt) => {
    const result = validateAssetsResponse(
      response({
        interestRates: {
          ethereum: { currencyId: "ethereum", rate: 0.04, type: "APY", fetchAt },
        } as unknown as RawApiResponse["interestRates"],
      }),
    );

    expect(result.interestRates.ethereum).toMatchObject({ rate: 0.04, type: "APY" });
  });

  it("still drops a rate whose value is unusable", () => {
    const result = validateAssetsResponse(
      response({
        interestRates: {
          ethereum: { currencyId: "ethereum", rate: "4%", type: "APY" },
        } as unknown as RawApiResponse["interestRates"],
      }),
    );

    expect(result.interestRates).toEqual({});
  });

  /* Merging pushes into metaCurrencyIds, so a shared fallback would accumulate across responses. */
  it("returns a fresh ordering fallback for each response", () => {
    const broken = { currenciesOrder: {} as RawApiResponse["currenciesOrder"] };

    const first = validateAssetsResponse(response(broken));
    first.currenciesOrder.metaCurrencyIds.push("leaked");
    const second = validateAssetsResponse(response(broken));

    expect(second.currenciesOrder.metaCurrencyIds).toEqual([]);
  });

  it("tolerates a collection missing from the response", () => {
    const { cryptoAssets: _omitted, ...withoutAssets } = response();

    const result = validateAssetsResponse(withoutAssets as RawApiResponse);

    expect(result.cryptoAssets).toEqual({});
  });
});
