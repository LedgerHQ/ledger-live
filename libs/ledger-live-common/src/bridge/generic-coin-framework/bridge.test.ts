import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { loadBridgeApiForFamily } from "../../coin-modules/registry";
import { getBridgeApi, getBridgeApiResolver } from "./bridge";

jest.mock("../../coin-modules/registry", () => ({ loadBridgeApiForFamily: jest.fn() }));

const bitcoin = getCryptoCurrencyById("bitcoin");

describe.each([
  ["getBridgeApi", async (network: string) => getBridgeApi(bitcoin, network)],
  ["getBridgeApiResolver", async (network: string) => (await getBridgeApiResolver(network))(bitcoin)],
])("%s", (_name, resolve) => {
  it("is empty for a family without bridge api", async () => {
    (loadBridgeApiForFamily as jest.Mock).mockReturnValue(undefined);
    expect(await resolve("none")).toEqual({});
  });

  it("returns a family's bridge api object", async () => {
    const api = { shouldMergeOps: false };
    (loadBridgeApiForFamily as jest.Mock).mockResolvedValue(api);
    expect(await resolve("x")).toBe(api);
  });

  it("instantiates a family's bridge api for the currency", async () => {
    const factory = jest.fn(() => ({ stakingSupported: true }));
    (loadBridgeApiForFamily as jest.Mock).mockResolvedValue(factory);
    expect(await resolve("x")).toEqual({ stakingSupported: true });
    expect(factory).toHaveBeenCalledWith(bitcoin);
  });
});
