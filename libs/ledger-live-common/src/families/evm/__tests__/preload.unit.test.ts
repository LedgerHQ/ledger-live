import evms from "@ledgerhq/cryptoassets/data/evm/index";
import { ERC20Token } from "@ledgerhq/cryptoassets/types";
import * as CALTokensAPI from "@ledgerhq/cryptoassets/tokens";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { fetchERC20Tokens, hydrate, preload } from "../preload";
import network from "../../../network";

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
const currency1 = getCryptoCurrencyById("ethereum"); // chain id 1

jest.mock("../../../network");
jest.mock("@ledgerhq/cryptoassets/data/evm/index", () => ({
  // @ts-expect-error ES6
  get tokens() {
    return {
      1: [usdcDefinition],
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
  });

  describe("preload.ts", () => {
    describe("fetchERC20Tokens", () => {
      it("should load dynamically the tokens", async () => {
        // @ts-expect-error not casted as jest mock
        network.mockResolvedValue({ data: [usdtDefinition] });

        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual([usdtDefinition]);
      });

      it("should fallback on local CAL on dynamic CAL error", async () => {
        // @ts-expect-error not casted as jest mock
        network.mockImplementationOnce(async () => {
          throw new Error();
        });

        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual([usdcDefinition]);
      });

      it("should load erc20 tokens from local CAL when dynamic CAL undefined", async () => {
        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual([usdcDefinition]);
      });

      it("should load erc20 tokens from local CAL when dynamic CAL is empty []", async () => {
        // @ts-expect-error not casted as jest mock
        network.mockResolvedValue({
          data: {
            tokens: { 1: [] },
          },
        });

        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual([usdcDefinition]);
      });

      it("should return empty [] if dynamic CAL fails and local CAL fails", async () => {
        jest
          .spyOn(evms, "tokens", "get")
          .mockImplementationOnce(() => ({} as any));

        const tokens = await fetchERC20Tokens(currency1);
        expect(tokens).toEqual([]);
      });
    });

    describe("preload", () => {
      it("should register tokens", async () => {
        jest
          .spyOn(CALTokensAPI, "addTokens")
          .mockImplementationOnce(() => null);

        const tokens = await preload(currency1);

        expect(tokens).toEqual([usdcDefinition]);
        expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
          CALTokensAPI.convertERC20(usdcDefinition),
        ]);
      });
    });

    describe("hydrate", () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });

      it("should return void", () => {
        expect(hydrate(undefined)).toBe(undefined);
      });

      it("should register tokens", async () => {
        jest
          .spyOn(CALTokensAPI, "addTokens")
          .mockImplementationOnce(() => null);

        await hydrate([usdcDefinition]);

        expect(CALTokensAPI.addTokens).toHaveBeenCalledWith([
          CALTokensAPI.convertERC20(usdcDefinition),
        ]);
      });
    });
  });
});
