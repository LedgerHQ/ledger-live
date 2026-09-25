/* eslint-disable @typescript-eslint/consistent-type-assertions */
import BigNumber from "bignumber.js";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import solanaBridge, {
  buildIntentData,
  computeIntentType,
  getDeviceSignOptions,
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

    it.each([
      ["delegate", "DELEGATE"],
      ["undelegate", "UNDELEGATE"],
      ["unstake", "WITHDRAW_UNBONDED"],
      ["split", "FEES"],
      ["approve", "FEES"],
      ["revoke", "FEES"],
    ])("types a %s as %s and moves no principal", (mode, expected) => {
      expect(describeOptimisticOperation(mode, account, { fees })).toEqual({
        type: expected,
        value: new BigNumber(0),
      });
    });

    it("locks the delegated amount and the stake account rent when opening a stake", () => {
      expect(
        describeOptimisticOperation("stake", account, {
          fees,
          amount: new BigNumber(1_000_000_000),
          stakeAccountRent: new BigNumber(2_282_880),
        }),
      ).toEqual({ type: "DELEGATE", value: new BigNumber(1_002_282_880) });
    });

    it("leaves the rent inside the amount when opening a stake with send-max", () => {
      expect(
        describeOptimisticOperation("stake", account, {
          fees,
          useAllAmount: true,
          amount: new BigNumber(1_000_000_000),
          stakeAccountRent: new BigNumber(2_282_880),
        }),
      ).toEqual({ type: "DELEGATE", value: new BigNumber(1_000_000_000) });
    });

    it("types an opt-in as OPT_IN, its rent already carried by the fee", () => {
      expect(describeOptimisticOperation("opt-in", account, { fees })).toEqual({
        type: "OPT_IN",
        value: new BigNumber(0),
      });
    });

    it("leaves a plain send to the generic mapping", () => {
      expect(describeOptimisticOperation("send", account, { fees })).toBeUndefined();
    });

    it("falls back to a zero value when the amount is not loaded", () => {
      expect(describeOptimisticOperation("stake", account, {})?.value).toEqual(new BigNumber(0));
    });
  });

  describe("getDeviceSignOptions", () => {
    const withToken = {
      subAccounts: [{ id: "sub-1", token: mockToken }],
    } as unknown as Parameters<typeof getDeviceSignOptions>[1];

    it("names the recipient token account so the device can resolve its owner", () => {
      expect(
        getDeviceSignOptions(
          {
            subAccountId: "sub-1",
            recipientTokenAccount: "recipient-ata",
            userInputType: "sol",
          },
          withToken,
        ),
      ).toEqual({
        tokenInternalId: mockToken.id,
        tokenAddress: "recipient-ata",
        userInputType: "sol",
      });
    });

    it("opens the recipient account instead of naming one that does not exist yet", () => {
      expect(
        getDeviceSignOptions(
          {
            subAccountId: "sub-1",
            recipientWalletAddress: "recipient-wallet",
            assetReference: mockToken.contractAddress,
            userInputType: "sol",
          },
          withToken,
        ),
      ).toEqual({
        tokenInternalId: mockToken.id,
        createATA: { address: "recipient-wallet", mintAddress: mockToken.contractAddress },
        userInputType: "sol",
      });
    });

    it("names the owner when the transaction opens their own account", () => {
      expect(
        getDeviceSignOptions(
          {
            mode: "opt-in",
            subAccountId: "sub-1",
            assetReference: mockToken.contractAddress,
          },
          { ...withToken, freshAddress: "owner-addr" } as typeof withToken,
        ),
      ).toEqual({
        createATA: { address: "owner-addr", mintAddress: mockToken.contractAddress },
      });
    });

    it("still names the token when the wallet API signs against a placeholder sub-account", () => {
      expect(
        getDeviceSignOptions(
          {
            subAccountId: `${"parent"}+${mockToken.contractAddress}`,
            recipientTokenAccount: "recipient-ata",
            assetReference: mockToken.contractAddress,
            userInputType: "sol",
          },
          withToken,
        ),
      ).toEqual({
        tokenInternalId: mockToken.id,
        tokenAddress: "recipient-ata",
        userInputType: "sol",
      });
    });

    it("carries the template id of a partner-built transaction", () => {
      expect(getDeviceSignOptions({ templateId: "tpl-1" }, withToken)).toEqual({
        templateId: "tpl-1",
      });
    });

    it("returns nothing for a plain native send", () => {
      expect(getDeviceSignOptions({ recipient: "addr" }, withToken)).toBeUndefined();
    });
  });

  describe("buildIntentData", () => {
    it("carries a partner-built transaction so the bytes reach the coin module", () => {
      expect(buildIntentData({ raw: "AQID", templateId: "tpl-1" })).toEqual({
        type: "buffer",
        value: Buffer.from("AQID", "base64"),
      });
    });

    it("carries the stake account seed when there is no partner payload", () => {
      expect(buildIntentData({ familySpecificData: { stakeAccountSeed: "seed-1" } })).toEqual({
        type: "stakeAccountSeed",
        value: "seed-1",
      });
    });

    it("leaves every other transaction to the coin module", () => {
      expect(buildIntentData({ mode: "send", recipient: "addr" })).toEqual({ type: "none" });
    });
  });
});
