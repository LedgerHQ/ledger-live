jest.useFakeTimers();

import { jlpDefinition, soEthDefinition, graphitDefinition } from "./preload.fixtures";
import axios, { AxiosResponse } from "axios";
import * as CALTokensAPI from "@ledgerhq/cryptoassets/tokens";
import { fetchSPLTokens, hydrate, preloadWithAPI } from "../preload";
import { __resetCALHash, getCALHash, setCALHash } from "../logic";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { ChainAPI } from "../network";

jest.mock("axios");
const mockedAxios = jest.mocked(axios);
mockedAxios.AxiosError = jest.requireActual("axios").AxiosError;

jest.mock("@ledgerhq/cryptoassets/data/spl", () => ({
  __esModule: true, // Ensures the mock is treated as an ES module
  default: [jlpDefinition, soEthDefinition], // Mocked as an array

  get hash() {
    return "initialStateSolana"; // Mocked hash value
  },
}));
const mockCurrency: CryptoCurrency = getCryptoCurrencyById("solana");

const mockAPI = {
  getVoteAccounts: jest.fn(),
} as unknown as ChainAPI;

const mockGetAPI = jest.fn(() => Promise.resolve(mockAPI));
jest.mock("../network/validator-app", () => ({
  getValidators: jest.fn(() => [{ commission: 50 }, { commission: 90 }, { commission: 110 }]),
}));

describe("Solana Family", () => {
  beforeEach(() => {
    CALTokensAPI.__clearAllLists();
    mockedAxios.get.mockImplementation(async (url, { params, headers } = {}) => {
      if (url !== "https://crypto-assets-service.api.ledger.com/v1/tokens")
        throw new Error("UNEXPECTED URL");

      if (params.blockchain_name === "solana") {
        if (headers?.["If-None-Match"] === "newStateSolana")
          throw new axios.AxiosError("", "", undefined, undefined, {
            status: 304,
          } as AxiosResponse);

        return {
          data: [jlpDefinition, soEthDefinition].map(tokenDef => ({
            network: tokenDef[1],
            id: tokenDef[0],
            ticker: tokenDef[3],
            decimals: tokenDef[5],
            name: tokenDef[2],
            contract_address: tokenDef[4],
          })),
          headers: { ["etag"]: "newStateSolana" },
        };
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    __resetCALHash();
  });

  describe("fetchSPLTokens", () => {
    beforeEach(() => {
      jest.spyOn(CALTokensAPI, "addTokens").mockImplementation(() => null);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
    it("should return the embedded tokens if there is no update on remote and tokens are not loaded", async () => {
      mockedAxios.get.mockImplementationOnce((url, { headers } = {}) => {
        if (headers?.["If-None-Match"] === "initialStateSolana")
          throw new axios.AxiosError("", "", undefined, undefined, {
            status: 304,
          } as AxiosResponse);
        throw new Error("unexpected");
      });

      expect(getCALHash(mockCurrency)).toBe("");
      const tokens = await fetchSPLTokens(mockCurrency);
      expect(tokens).toEqual([jlpDefinition, soEthDefinition]);
      expect(getCALHash(mockCurrency)).toBe("initialStateSolana");
    });

    it("should return nothing if loaded tokens are up to date with remote already", async () => {
      setCALHash(mockCurrency, "newStateSolana");

      const tokens = await fetchSPLTokens(mockCurrency);
      expect(tokens).toEqual(null);
      expect(getCALHash(mockCurrency)).toBe("newStateSolana");
    });

    it("should return the content of the remote CAL", async () => {
      setCALHash(mockCurrency, "initialStateSolana");

      const tokens = await fetchSPLTokens(mockCurrency);
      expect(tokens).toEqual([jlpDefinition, soEthDefinition]);
      expect(getCALHash(mockCurrency)).toBe("newStateSolana");
    });

    it("should return nothing and maintain the saved CAL hash if the CAL service is down", async () => {
      mockedAxios.get.mockImplementation(() => {
        throw new Error();
      });

      setCALHash(mockCurrency, "anything");
      const tokens = await fetchSPLTokens(mockCurrency);
      expect(tokens).toEqual(null);
      expect(getCALHash(mockCurrency)).toBe("anything");
    });
  });

  describe("preloadWithAPI", () => {
    beforeEach(() => {
      jest.spyOn(CALTokensAPI, "addTokens").mockImplementation(() => null);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return void when fetch is hitting cache", async () => {
      setCALHash(mockCurrency, "newStateSolana");
      const data = await preloadWithAPI(mockCurrency, mockGetAPI);
      expect(data.splTokens).toEqual(null);
      expect(CALTokensAPI.addTokens).not.toHaveBeenCalled();
    });

    it("should return and register the new SPL tokens", async () => {
      setCALHash(mockCurrency, "initialStateSolana");
      const data = await preloadWithAPI(mockCurrency, mockGetAPI);
      expect(data.splTokens).toEqual([jlpDefinition, soEthDefinition]);
      expect(CALTokensAPI.addTokens).toHaveBeenCalledTimes(1);
      expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
        CALTokensAPI.convertSplTokens(jlpDefinition),
        CALTokensAPI.convertSplTokens(soEthDefinition),
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

    it("should not do anything", async () => {
      hydrate(undefined, mockCurrency);
      expect(CALTokensAPI.addTokens).toHaveBeenCalledTimes(0);
    });

    it("should register SPL tokens from embedded with null", async () => {
      hydrate(
        { version: "1", validators: [], validatorsWithMeta: [], splTokens: null },
        mockCurrency,
      );

      expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
        CALTokensAPI.convertSplTokens(jlpDefinition),
        CALTokensAPI.convertSplTokens(soEthDefinition),
      ]);
    });

    it("should register SPL tokens", async () => {
      hydrate(
        { version: "1", validators: [], validatorsWithMeta: [], splTokens: [graphitDefinition] },
        mockCurrency,
      );

      expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
        CALTokensAPI.convertSplTokens(graphitDefinition),
      ]);
    });
  });
});
