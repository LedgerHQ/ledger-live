/* eslint-disable @typescript-eslint/consistent-type-assertions */
import BigNumber from "bignumber.js";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import solanaBridge, {
  buildIntentData,
  computeIntentType,
  describeOptimisticOperation,
  getAssetFromToken,
  getTokenFromAsset,
} from "./api";

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore");

const mockToken = {
  id: "solana/spl/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  tokenType: "spl",
  contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  name: "USD Coin",
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
} as unknown as TokenCurrency;

const solana = getCryptoCurrencyById("solana");

describe("solana bridge", () => {
  describe("staking", () => {
    // The framework otherwise infers staking support from a non-empty delegation list, which is
    // empty for an account whose only stake account has not been delegated yet.
    it("declares staking support explicitly", () => {
      expect(solanaBridge(solana).stakingSupported).toBe(true);
    });
  });

  describe("computeIntentType", () => {
    it.each([
      [{ mode: "send" }, "send"],
      [{}, "send"],
      [{ mode: undefined }, "send"],
      [{ mode: "stake" }, "stake.createAccount"],
      [{ mode: "delegate" }, "stake.delegate"],
      [{ mode: "undelegate" }, "stake.undelegate"],
      [{ mode: "unstake" }, "stake.withdraw"],
    ])("should map %o to %s", (transaction, expected) => {
      expect(computeIntentType(transaction)).toBe(expected);
    });

    it("should throw for an unsupported mode", () => {
      expect(() => computeIntentType({ mode: "swap" })).toThrow(
        "Unsupported Solana transaction mode: swap",
      );
    });
  });

  describe("getTokenFromAsset", () => {
    const mockFindTokenByAddressInCurrency = jest.fn() as jest.MockedFunction<
      CryptoAssetsStore["findTokenByAddressInCurrency"]
    >;

    (
      jest.requireMock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore") as {
        getCryptoAssetsStore: jest.Mock;
      }
    ).getCryptoAssetsStore.mockReturnValue({
      findTokenByAddressInCurrency: mockFindTokenByAddressInCurrency,
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return undefined when asset type is native", async () => {
      const asset: AssetInfo = { type: "native" };

      const result = await getTokenFromAsset(solana, asset);

      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("should return undefined when asset has no assetReference", async () => {
      const asset = { type: "spl" } as AssetInfo;

      const result = await getTokenFromAsset(solana, asset);

      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("should call findTokenByAddressInCurrency with correct arguments", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(mockToken);
      const asset: AssetInfo = {
        type: "spl",
        assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      };

      await getTokenFromAsset(solana, asset);

      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        solana.id,
      );
    });

    it("should return the token when found", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(mockToken);
      const asset: AssetInfo = {
        type: "spl",
        assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      };

      const result = await getTokenFromAsset(solana, asset);

      expect(result).toBe(mockToken);
    });

    it("should return undefined when token is not found", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(undefined);
      const asset: AssetInfo = {
        type: "spl",
        assetReference: "UnknownMintAddress1111111111111111111111111",
      };

      const result = await getTokenFromAsset(solana, asset);

      expect(result).toBeUndefined();
    });
  });

  describe("getAssetFromToken", () => {
    const owner = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";

    it("should return correct AssetInfo with all fields mapped properly", () => {
      const result = getAssetFromToken(mockToken, owner);

      expect(result).toEqual({
        type: "spl",
        assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        assetOwner: owner,
        name: "USD Coin",
        unit: { name: "USDC", code: "USDC", magnitude: 6 },
      });
    });

    it("should use token.tokenType for type", () => {
      const result = getAssetFromToken(mockToken, owner);

      expect(result.type).toBe(mockToken.tokenType);
    });

    it("should use token.contractAddress for assetReference", () => {
      const result = getAssetFromToken(mockToken, owner);

      expect(result).toHaveProperty("assetReference", mockToken.contractAddress);
    });

    it("should pass owner as assetOwner", () => {
      const result = getAssetFromToken(mockToken, owner);

      expect(result).toHaveProperty("assetOwner", owner);
    });

    it("should use token.units[0] for unit", () => {
      const result = getAssetFromToken(mockToken, owner);

      expect(result.unit).toBe(mockToken.units[0]);
    });

    it("should use token.name for name", () => {
      const result = getAssetFromToken(mockToken, owner);

      expect(result.name).toBe(mockToken.name);
    });
  });

  describe("describeOptimisticOperation", () => {
    const account = {} as Parameters<typeof describeOptimisticOperation>[1];
    const fees = new BigNumber(5000);

    // The pending row must read the same as the row the next sync produces; see
    // coin-solana/logic/listOperations.ts for the types that sync resolves.
    it.each([
      ["stake", "DELEGATE"],
      ["delegate", "DELEGATE"],
      ["undelegate", "UNDELEGATE"],
      ["unstake", "WITHDRAW_UNBONDED"],
      // Undescribed, these fell back to `OUT` -- claiming the amount left the account, and letting
      // the stake account address a split carries as a memo surface as if the user had typed it.
      ["split", "FEES"],
      ["approve", "FEES"],
      ["revoke", "FEES"],
    ])("types a %s as %s, valued at the fee", (mode, expected) => {
      expect(describeOptimisticOperation(mode, account, { fees })).toEqual({
        type: expected,
        value: fees,
      });
    });

    it("leaves a plain send to the generic mapping", () => {
      expect(describeOptimisticOperation("send", account, { fees })).toBeUndefined();
    });

    it("falls back to a zero value when the fee is not loaded", () => {
      expect(describeOptimisticOperation("stake", account, {})?.value).toEqual(new BigNumber(0));
    });
  });

  describe("buildIntentData", () => {
    it("carries a partner-built transaction so the bytes reach the coin module", () => {
      expect(buildIntentData({ raw: "AQID", templateId: "tpl-1" })).toEqual({
        type: "solana",
        raw: "AQID",
        templateId: "tpl-1",
      });
    });

    it("omits an absent template id", () => {
      expect(buildIntentData({ raw: "AQID" })).toEqual({ type: "solana", raw: "AQID" });
    });

    it("leaves every other transaction to the coin module", () => {
      expect(buildIntentData({ mode: "send", recipient: "addr" })).toEqual({ type: "none" });
    });
  });
});
