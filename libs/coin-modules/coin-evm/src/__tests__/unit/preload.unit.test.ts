// do not move lower otherwise time based LRU tests won't work anymore
jest.useFakeTimers();

// eslint-disable-next-line import/order
import {
  binanceDaiDefinition,
  brettDefinition,
  toshiDefinition,
  usdcDefinition,
  usdtDefinition,
  wethDefinition,
} from "../fixtures/preload.fixtures";
// Maintain this order for the sake of jest mocks
import axios, { AxiosResponse } from "axios";
import * as CALTokensAPI from "@ledgerhq/cryptoassets/tokens";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { fetchERC20Tokens, hydrate, preload } from "../../preload";
import { __resetCALHash, getCALHash, setCALHash } from "../../logic";

const currency1 = getCryptoCurrencyById("ethereum"); // chain id 1
const currency2 = getCryptoCurrencyById("bsc"); // chain id 56
const currency3 = getCryptoCurrencyById("base"); // chain id 8453 + this has no preloaded tokens from @ledgerhq/cryptoassets/tokens.ts

jest.mock("axios");
const mockedAxios = jest.mocked(axios);
mockedAxios.AxiosError = jest.requireActual("axios").AxiosError;

jest.mock("@ledgerhq/cryptoassets/data/evm/index", () => ({
  get tokens() {
    return {
      1: [usdcDefinition],
      56: [binanceDaiDefinition],
      8453: [toshiDefinition],
      137: [],
      11155111: [],
    };
  },
  get hashes() {
    return {
      1: "initialState1",
      56: "initialState2",
      8453: "initialState3",
      137: "",
      11155111: "",
    };
  },
}));

describe("EVM Family", () => {
  beforeEach(() => {
    CALTokensAPI.__clearAllLists();
    mockedAxios.get.mockImplementation(async (url, { params, headers } = {}) => {
      if (url !== "https://crypto-assets-service.api.ledger.com/v1/tokens")
        throw new Error("UNEXPECTED URL");

      switch (params.chain_id) {
        case 1:
          if (headers?.["If-None-Match"] === "newState1")
            throw new axios.AxiosError("", "", undefined, undefined, {
              status: 304,
            } as AxiosResponse);

          return {
            data: [usdcDefinition, usdtDefinition].map(tokenDef => ({
              blockchain_name: tokenDef[0],
              id: `${tokenDef[0]}/erc20/${tokenDef[1]}`,
              ticker: tokenDef[2],
              decimals: tokenDef[3],
              name: tokenDef[4],
              live_signature: tokenDef[5],
              contract_address: tokenDef[6],
              delisted: tokenDef[8],
            })),
            headers: { ["etag"]: "newState1" },
          };

        case 56:
          if (headers?.["If-None-Match"] === "newState2")
            throw new axios.AxiosError("", "", undefined, undefined, {
              status: 304,
            } as AxiosResponse);

          return {
            data: [binanceDaiDefinition, wethDefinition].map(tokenDef => ({
              blockchain_name: tokenDef[0],
              id: `${tokenDef[0]}/bep20/${tokenDef[1]}`,
              ticker: tokenDef[2],
              decimals: tokenDef[3],
              name: tokenDef[4],
              live_signature: tokenDef[5],
              contract_address: tokenDef[6],
              delisted: tokenDef[8],
            })),
            headers: { ["etag"]: "newState2" },
          };

        case 8453:
          if (headers?.["If-None-Match"] === "newState3")
            throw new axios.AxiosError("", "", undefined, undefined, {
              status: 304,
            } as AxiosResponse);

          return {
            data: [toshiDefinition, brettDefinition].map(tokenDef => ({
              blockchain_name: tokenDef[0],
              id: `${tokenDef[0]}/erc20/${tokenDef[1]}`,
              ticker: tokenDef[2],
              decimals: tokenDef[3],
              name: tokenDef[4],
              live_signature: tokenDef[5],
              contract_address: tokenDef[6],
              delisted: tokenDef[8],
            })),
            headers: { ["etag"]: "newState3" },
          };

        default:
          throw new Error("UNEXPECTED CHAIN_ID");
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    __resetCALHash();
  });

  describe("preload.ts", () => {
    describe("fetchERC20Tokens", () => {
      it("shouldn't do anything if the currency has no chain id", async () => {
        const res = await fetchERC20Tokens({ ethereumLikeInfo: {} } as any);
        expect(res).toEqual(null);
      });

      it("should return the embedded tokens if there is no update on remote and tokens are not loaded", async () => {
        mockedAxios.get.mockImplementationOnce((url, { headers } = {}) => {
          if (headers?.["If-None-Match"] === "initialState1")
            throw new axios.AxiosError("", "", undefined, undefined, {
              status: 304,
            } as AxiosResponse);
          throw new Error("unexpected");
        });

        expect(getCALHash(currency1)).toBe("");
        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual([usdcDefinition]);
        expect(getCALHash(currency1)).toBe("initialState1");
      });

      it("should return nothing if loaded tokens are up to date with remote already", async () => {
        setCALHash(currency2, "newState2");

        const tokens = await fetchERC20Tokens(currency2);
        expect(tokens).toEqual(null);
        expect(getCALHash(currency2)).toBe("newState2");
      });

      it("should return the content of the remote CAL", async () => {
        setCALHash(currency3, "initialState3");

        const tokens = await fetchERC20Tokens(currency3);
        expect(tokens).toEqual([toshiDefinition, brettDefinition]);
        expect(getCALHash(currency3)).toBe("newState3");
      });

      it("should return nothing and maintain the saved CAL hash if the CAL service is down", async () => {
        mockedAxios.get.mockImplementation(() => {
          throw new Error();
        });

        setCALHash(currency1, "anything");
        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual(null);
        expect(getCALHash(currency1)).toBe("anything");
      });
    });

    describe("preload", () => {
      beforeEach(() => {
        jest.spyOn(CALTokensAPI, "addTokens").mockImplementation(() => null);
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it("should return void when fetch is hitting cache", async () => {
        setCALHash(currency1, "newState1");
        const tokens = await preload(currency1);
        expect(tokens).toEqual(undefined);
        expect(CALTokensAPI.addTokens).not.toHaveBeenCalled();
      });

      it("should return and register the new ERC20 tokens", async () => {
        setCALHash(currency1, "initialState1");
        const tokens = await preload(currency1);
        expect(tokens).toEqual([usdcDefinition, usdtDefinition]);
        expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
          CALTokensAPI.convertERC20(usdcDefinition),
          CALTokensAPI.convertERC20(usdtDefinition),
        ]);
      });
    });

    describe("hydrate", () => {
      beforeEach(() => {
        jest.spyOn(CALTokensAPI, "addTokens").mockImplementation(() => null);
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it("should register ERC20 tokens from embedded", async () => {
        hydrate(undefined, currency1);

        expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
          CALTokensAPI.convertERC20(usdcDefinition),
        ]);
      });

      it("should register ERC20 tokens", async () => {
        hydrate([usdcDefinition, usdtDefinition], currency1);

        expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
          CALTokensAPI.convertERC20(usdcDefinition),
          CALTokensAPI.convertERC20(usdtDefinition),
        ]);
      });

      it("should register BEP20 tokens", async () => {
        hydrate([binanceDaiDefinition], currency2);

        expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
          CALTokensAPI.convertERC20(binanceDaiDefinition),
        ]);
      });
    });
  });
});
