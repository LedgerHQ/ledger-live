// do not move lower otherwise time based LRU tests won't work anymore
jest.useFakeTimers();

import axios from "axios";
import { ERC20Token } from "@ledgerhq/cryptoassets/types";
import * as CALTokensAPI from "@ledgerhq/cryptoassets/tokens";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { fetchERC20Tokens, hydrate, preload } from "../../preload";
import { getCALHash, setCALHash } from "../../logic";

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
];
const binanceDaiDefinition: ERC20Token = [
  "bsc",
  "binance-peg_dai_token",
  "DAI",
  18,
  "Binance-Peg Dai Token",
  "3044022032f0a880722af8c9e2196b5c0fc5273e2088f23692bdd2b35f6cf41c4001213f02205226e2023e409c73b031c790c64ae24db67c04b0aefd0d979b8c5002ca969b7b",
  "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
  false,
  false,
];
const wethDefinition: ERC20Token = [
  "bsc",
  "wrapped_ether_wormhole",
  "WETH",
  18,
  "Wrapped Ether (Wormhole)",
  "3045022100b83ee696d6d934c7b1b30f62ca9736a5d36a0020e8c03757ffb51f81aa7f599802201e89feebccb518251fe6151b82ddcdc8c552b012429326ea7ea1fb0e308af60d",
  "0x4DB5a66E937A9F4473fA95b1cAF1d1E1D62E29EA",
  false,
  false,
];

const currency1 = getCryptoCurrencyById("ethereum"); // chain id 1
const currency2 = getCryptoCurrencyById("bsc"); // chain id 56
const currency3 = getCryptoCurrencyById("base"); // chain id 8453 + this has no preloaded tokens from @ledgerhq/cryptoassets/tokens.ts

jest.mock("axios");
jest.mock("@ledgerhq/cryptoassets/data/evm/index", () => ({
  get tokens(): {
    1: ERC20Token[];
    56: ERC20Token[];
    8453: ERC20Token[];
  } {
    return {
      1: [usdcDefinition],
      56: [binanceDaiDefinition],
      8453: [usdcDefinition],
    };
  },
  get hashes(): {
    1: string;
    56: string;
    8453: string;
  } {
    return {
      1: "initialState1",
      56: "initialState2",
      8453: "initialState3",
    };
  },
}));

describe("EVM Family", () => {
  beforeEach(() => {
    // @ts-expect-error not casted as jest mock
    axios.get.mockImplementation(async (url, { headers }) => {
      const [, chainId] = url.match(new RegExp("/evm/(.*)/erc20.json"));
      if (!headers["If-None-Match"].includes("initialState")) {
        switch (chainId) {
          case "1":
            return { data: [usdtDefinition], headers: { etag: "newState1" } };
          case "56":
            return { data: [wethDefinition], headers: { etag: "newState2" } };
          case "8453":
            return { data: [usdtDefinition], headers: { etag: "newState3" } };
          default:
            throw new Error("UNEXPECTED");
        }
      } else {
        const error = new Error() as Error & { code: string };
        error.code = "304";
        return Promise.reject(error);
      }
    });
    setCALHash(currency1, "initialState1");
    setCALHash(currency2, "initialState2");
    setCALHash(currency3, "initialState3");
  });

  afterEach(() => {
    jest.restoreAllMocks();

    setCALHash(currency1, "");
    setCALHash(currency2, "");
    setCALHash(currency3, "");
  });

  describe("preload.ts", () => {
    describe("fetchERC20Tokens", () => {
      it("shouldn't do anything if no changes & tokens are set", async () => {
        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual(null);
        expect(getCALHash(currency1)).toBe("initialState1");
      });

      it("should load embedded tokens if no changes & tokens are not set", async () => {
        const tokens = await fetchERC20Tokens(currency3);
        expect(tokens).toEqual([usdcDefinition]);
        expect(getCALHash(currency3)).toBe("initialState3");
      });

      it("should return null on unexpected CAL response", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementationOnce(async () => ({
          data: {},
        }));
        setCALHash(currency1, "anotherHash1");

        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual(null);
        expect(getCALHash(currency1)).toBe("anotherHash1");
      });

      it("should load dynamically the ERC20 tokens", async () => {
        setCALHash(currency1, "anotherHash1");
        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual([usdtDefinition]);
        expect(getCALHash(currency1)).toBe("newState1");
      });

      it("should load dynamically the BEP20 tokens", async () => {
        setCALHash(currency2, "anotherHash2");

        const tokens = await fetchERC20Tokens(currency2);
        expect(tokens).toEqual([wethDefinition]);
        expect(getCALHash(currency2)).toBe("newState2");
      });

      it("should fallback on embedded CAL on dynamic CAL error", async () => {
        // @ts-expect-error not casted as jest mock
        axios.get.mockImplementationOnce(async () => {
          throw new Error();
        });
        setCALHash(currency1, "anotherHash1");

        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual([usdcDefinition]);
        expect(getCALHash(currency1)).toBe("initialState1");
      });
    });

    describe("preload", () => {
      beforeEach(() => {
        jest.spyOn(CALTokensAPI, "addTokens").mockImplementationOnce(() => null);
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it("should return void when fetch is hitting cache", async () => {
        const tokens = await preload(currency1);
        expect(tokens).toEqual(undefined);
      });

      it("should register ERC20 tokens", async () => {
        setCALHash(currency1, "unknownHash1");
        const tokens = await preload(currency1);

        expect(tokens).toEqual([usdtDefinition]);
        expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
          CALTokensAPI.convertERC20(usdtDefinition),
        ]);
      });

      it("should register BEP20 tokens", async () => {
        setCALHash(currency2, "unknownHash2");
        const tokens = await preload(currency2);

        expect(tokens).toEqual([wethDefinition]);
        expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
          CALTokensAPI.convertERC20(wethDefinition),
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
          CALTokensAPI.convertERC20(binanceDaiDefinition),
        ]);
      });
    });
  });
});
