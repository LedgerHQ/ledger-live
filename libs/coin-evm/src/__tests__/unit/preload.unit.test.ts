// do not move lower otherwise time based LRU tests won't work anymore
jest.useFakeTimers();

import network from "@ledgerhq/live-network/network";
import evms from "@ledgerhq/cryptoassets/data/evm/index";
import { BEP20Token, ERC20Token } from "@ledgerhq/cryptoassets/types";
import * as CALTokensAPI from "@ledgerhq/cryptoassets/tokens";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { fetchERC20Tokens, hydrate, preload } from "../../preload";

const usdcDefinition: ERC20Token = [
  "ethereum",
  "usd__coin",
  "USDC",
  6,
  "USD Coin",
  "3045022100b2e358726e4e6a6752cf344017c0e9d45b9a904120758d45f61b2804f9ad5299022015161ef28d8c4481bd9432c13562def9cce688bcfec896ef244c9a213f106cdd",
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  false,
  false,
  undefined,
  undefined,
];
const usdtDefinition: ERC20Token = [
  "ethereum",
  "usd_tether__erc20_",
  "USDT",
  6,
  "Tether USD",
  "3044022078c66ccea3e4dedb15a24ec3c783d7b582cd260daf62fd36afe9a8212a344aed0220160ba8c1c4b6a8aa6565bed20632a091aeeeb7bfdac67fc6589a6031acbf511c",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  false,
  false,
  undefined,
  undefined,
];
const binanceDaiDefinition: BEP20Token = [
  "bsc",
  "binance-peg_dai_token",
  "DAI",
  18,
  "Binance-Peg Dai Token",
  "3044022032f0a880722af8c9e2196b5c0fc5273e2088f23692bdd2b35f6cf41c4001213f02205226e2023e409c73b031c790c64ae24db67c04b0aefd0d979b8c5002ca969b7b",
  "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
  true,
  false,
];
const currency1 = getCryptoCurrencyById("ethereum"); // chain id 1
const currency2 = getCryptoCurrencyById("bsc"); // chain id 56

jest.mock("@ledgerhq/live-network/network");
jest.mock("@ledgerhq/cryptoassets/data/evm/index", () => ({
  get tokens(): {
    1: ERC20Token[];
    56: BEP20Token[];
  } {
    return {
      1: [usdcDefinition],
      56: [binanceDaiDefinition],
    };
  },
}));

describe("EVM Family", () => {
  beforeEach(() => {
    // @ts-expect-error not casted as jest mock
    network.mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // @ts-expect-error exposed reset method from `makeLRUCache`
    fetchERC20Tokens.reset();
  });

  describe("preload.ts", () => {
    describe("fetchERC20Tokens", () => {
      it("should respect the cache", async () => {
        jest.advanceTimersByTime(1); // necessary for LRU to not consider the TTL as infinity
        await fetchERC20Tokens(currency1);
        await fetchERC20Tokens(currency1);
        expect(network).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(6 * 60 * 60 * 1000 + 1); // Wait 6 hours and 1 millisecond
        await fetchERC20Tokens(currency1);
        expect(network).toHaveBeenCalledTimes(2);
      });

      it("should load dynamically the ERC20 tokens", async () => {
        // @ts-expect-error not casted as jest mock
        network.mockResolvedValue({ data: [usdtDefinition] });

        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual([usdtDefinition]);
      });

      it("should load dynamically the BEP20 tokens", async () => {
        // @ts-expect-error not casted as jest mock
        network.mockResolvedValue({ data: [binanceDaiDefinition] });

        const tokens = await fetchERC20Tokens(currency2);
        expect(tokens).toEqual([binanceDaiDefinition]);
      });

      it("should fallback on local CAL on dynamic CAL error", async () => {
        // @ts-expect-error not casted as jest mock
        network.mockImplementationOnce(async () => {
          throw new Error();
        });

        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual([usdcDefinition]);
        const bep20tokens = await fetchERC20Tokens(currency2);
        expect(bep20tokens).toEqual([binanceDaiDefinition]);
      });

      it("should load erc20 tokens from local CAL when dynamic CAL undefined", async () => {
        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual([usdcDefinition]);
        const bep20tokens = await fetchERC20Tokens(currency2);
        expect(bep20tokens).toEqual([binanceDaiDefinition]);
      });

      it("should load erc20 tokens from local CAL when dynamic CAL is empty []", async () => {
        // @ts-expect-error not casted as jest mock
        network.mockResolvedValue({
          data: {
            tokens: { 1: [], 56: [] },
          },
        });

        const erc20tokens = await fetchERC20Tokens(currency1);
        expect(erc20tokens).toEqual([usdcDefinition]);
        const bep20tokens = await fetchERC20Tokens(currency2);
        expect(bep20tokens).toEqual([binanceDaiDefinition]);
      });

      it("should return empty [] if dynamic CAL fails and local CAL fails", async () => {
        jest.spyOn(evms, "tokens", "get").mockImplementationOnce(() => ({}) as any);

        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual([]);
      });
    });

    describe("preload", () => {
      it("should register tokens", async () => {
        jest.spyOn(CALTokensAPI, "addTokens").mockImplementationOnce(() => null);

        const tokens = await preload(currency1);

        expect(tokens).toEqual([usdcDefinition]);
        expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
          CALTokensAPI.convertERC20(usdcDefinition),
        ]);
      });

      it("should register BEP20 tokens", async () => {
        jest.spyOn(CALTokensAPI, "addTokens").mockImplementationOnce(() => null);

        const tokens = await preload(currency2);

        expect(tokens).toEqual([binanceDaiDefinition]);
        expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
          CALTokensAPI.convertBEP20(binanceDaiDefinition),
        ]);
      });
    });

    describe("hydrate", () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });

      it("should return void", () => {
        expect(hydrate(undefined, currency1)).toBe(undefined);
        expect(hydrate(undefined, currency2)).toBe(undefined);
      });

      it("should register ERC20 tokens", async () => {
        jest.spyOn(CALTokensAPI, "addTokens").mockImplementationOnce(() => null);

        await hydrate([usdcDefinition], currency1);

        expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
          CALTokensAPI.convertERC20(usdcDefinition),
        ]);
      });

      it("should register BEP20 tokens", async () => {
        jest.spyOn(CALTokensAPI, "addTokens").mockImplementationOnce(() => null);

        await hydrate([binanceDaiDefinition], currency2);

        expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
          CALTokensAPI.convertBEP20(binanceDaiDefinition),
        ]);
      });
    });
  });
});
