/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { isAccountEmpty } from "@ledgerhq/coin-tron/index";
import { fetchTronAccount } from "@ledgerhq/coin-tron/network";
import {
  buildAccountShape,
  buildIntentData,
  getAssetFromToken,
  getTokenFromAsset,
  computeIntentType,
  describeOptimisticOperation,
  getDeviceSignOptions,
} from "./api";

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore");
jest.mock("@ledgerhq/coin-tron/network", () => ({ fetchTronAccount: jest.fn() }));

const trc20Token = {
  id: "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t",
  tokenType: "trc20",
  contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  name: "Tether USD",
  units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
} as unknown as TokenCurrency;

const trc10Token = {
  id: "tron/trc10/1002000",
  tokenType: "trc10",
  contractAddress: "1002000",
  name: "BitTorrent",
  units: [{ name: "BTT", code: "BTT", magnitude: 6 }],
} as unknown as TokenCurrency;

const tron = getCryptoCurrencyById("tron");

describe("tron bridge", () => {
  describe("buildAccountShape", () => {
    it("returns the zeroed defaults for an unactivated address", async () => {
      (fetchTronAccount as jest.Mock).mockResolvedValue([]);

      const shape = await buildAccountShape("TUnactivated");

      expect(shape).toEqual({ tronResources: expect.anything() });
      expect(isAccountEmpty(shape as { tronResources: never })).toBe(true);
    });
  });

  describe("computeIntentType", () => {
    it.each([
      [{ mode: "send" }, "send"],
      [{}, "send"],
      [{ mode: undefined }, "send"],
    ])("should map %o to %s", (transaction, expected) => {
      expect(computeIntentType(transaction)).toBe(expected);
    });

    it.each([
      "freeze",
      "unfreeze",
      "vote",
      "claimReward",
      "withdrawExpireUnfreeze",
      "unDelegateResource",
      "legacyUnfreeze",
    ])("should pass the resource-staking mode %s through as its own intent type", mode => {
      expect(computeIntentType({ mode })).toBe(mode);
    });

    it("should throw for an unsupported mode", () => {
      expect(() => computeIntentType({ mode: "delegate" })).toThrow(
        "Unsupported Tron transaction mode: delegate",
      );
    });
  });

  describe("buildIntentData", () => {
    it("maps the staking fields out of familySpecificData", () => {
      const votes = [{ name: "sr", address: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH", voteCount: 7 }];

      expect(
        buildIntentData({
          mode: "vote",
          familySpecificData: { resource: "BANDWIDTH", duration: 3, votes },
        }),
      ).toEqual({ type: "tron", mode: "vote", resource: "BANDWIDTH", duration: 3, votes });
    });

    it("returns the bare discriminant for a plain send", () => {
      expect(buildIntentData({ mode: "send" })).toEqual({ type: "tron", mode: "send" });
    });

    it("omits absent fields rather than sending explicit undefined", () => {
      expect(
        buildIntentData({ mode: "freeze", familySpecificData: { resource: "ENERGY" } }),
      ).toEqual({ type: "tron", mode: "freeze", resource: "ENERGY" });
    });

    it("drops keys it does not model, so a stray field cannot reach the coin module", () => {
      const data = buildIntentData({
        mode: "freeze",
        familySpecificData: { resource: "ENERGY", somethingElse: "ignored" },
      });

      expect(data).not.toHaveProperty("somethingElse");
    });

    it("preserves a null resource, which the UI uses for 'not chosen yet'", () => {
      expect(buildIntentData({ mode: "freeze", familySpecificData: { resource: null } })).toEqual({
        type: "tron",
        mode: "freeze",
        resource: null,
      });
    });
  });

  describe("describeOptimisticOperation", () => {
    it.each([
      ["freeze", "FREEZE"],
      ["unfreeze", "UNFREEZE"],
      ["vote", "VOTE"],
      ["withdrawExpireUnfreeze", "WITHDRAW_EXPIRE_UNFREEZE"],
      ["unDelegateResource", "UNDELEGATE_RESOURCE"],
      ["legacyUnfreeze", "LEGACY_UNFREEZE"],
    ])("maps the resource-staking mode %s to the %s operation type", (mode, expected) => {
      expect(describeOptimisticOperation(mode, {} as never)).toEqual({
        type: expected,
        value: new BigNumber(0),
      });
    });

    it("reports the accrued reward as a claim's value, since the transaction carries no amount", () => {
      const account = { tronResources: { unwithdrawnReward: new BigNumber(1234) } };

      // No type: `claimReward` is a generic mode the framework already maps to `REWARD`.
      expect(describeOptimisticOperation("claimReward", account as never)).toEqual({
        value: new BigNumber(1234),
      });
    });

    it.each(["claimReward", "send"])(
      "leaves %s entirely to the framework when there is nothing Tron-specific to say",
      mode => {
        expect(describeOptimisticOperation(mode, {} as never)).toBeUndefined();
      },
    );
  });

  describe("getDeviceSignOptions", () => {
    const signedToken = { ...trc10Token, ledgerSignature: "3045cafe" };
    const account = {
      subAccounts: [{ id: "sub-1", token: signedToken }],
    };

    it("passes the token's CAL signature for a sub-account send, which app-tron clear-signs with", () => {
      expect(getDeviceSignOptions({ subAccountId: "sub-1" }, account as never)).toEqual({
        token: { id: signedToken.id, ledgerSignature: "3045cafe" },
      });
    });

    it.each([
      ["a main-account send", {}],
      ["a sub-account the sync has not produced yet", { subAccountId: "sub-unknown" }],
    ])("supplies nothing for %s", (_case, transaction) => {
      expect(getDeviceSignOptions(transaction, account as never)).toBeUndefined();
    });
  });

  describe("getTokenFromAsset", () => {
    const mockFindTokenByAddressInCurrency = jest.fn() as jest.MockedFunction<
      CryptoAssetsStore["findTokenByAddressInCurrency"]
    >;
    const mockFindTokenById = jest.fn() as jest.MockedFunction<CryptoAssetsStore["findTokenById"]>;

    (
      jest.requireMock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore") as {
        getCryptoAssetsStore: jest.Mock;
      }
    ).getCryptoAssetsStore.mockReturnValue({
      findTokenByAddressInCurrency: mockFindTokenByAddressInCurrency,
      findTokenById: mockFindTokenById,
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return undefined when asset type is native", async () => {
      const asset: AssetInfo = { type: "native" };

      const result = await getTokenFromAsset(tron, asset);

      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("should return undefined when asset has no assetReference", async () => {
      const asset = { type: "trc20" } as AssetInfo;

      const result = await getTokenFromAsset(tron, asset);

      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("should resolve a TRC20 token by its contract address", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(trc20Token);
      const asset: AssetInfo = {
        type: "trc20",
        assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      };

      const result = await getTokenFromAsset(tron, asset);

      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(
        "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        tron.id,
      );
      expect(result).toBe(trc20Token);
    });

    it("should resolve a TRC10 token by its id (mirrors the legacy synchronization lookup)", async () => {
      mockFindTokenById.mockResolvedValue(trc10Token);
      const asset: AssetInfo = { type: "trc10", assetReference: "1002000" };

      const result = await getTokenFromAsset(tron, asset);

      expect(mockFindTokenById).toHaveBeenCalledWith(`${tron.id}/trc10/1002000`);
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
      expect(result).toBe(trc10Token);
    });

    it("should return undefined when token is not found", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(undefined);
      const asset: AssetInfo = { type: "trc20", assetReference: "UnknownContract" };

      const result = await getTokenFromAsset(tron, asset);

      expect(result).toBeUndefined();
    });
  });

  describe("getAssetFromToken", () => {
    const owner = "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8";

    it("should map a TRC20 token to AssetInfo", () => {
      const result = getAssetFromToken(trc20Token, owner);

      expect(result).toEqual({
        type: "trc20",
        assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        assetOwner: owner,
        name: "Tether USD",
        unit: { name: "USDT", code: "USDT", magnitude: 6 },
      });
    });

    it("should map a TRC10 token to AssetInfo using its asset id as assetReference", () => {
      const result = getAssetFromToken(trc10Token, owner);

      expect(result).toEqual({
        type: "trc10",
        assetReference: "1002000",
        assetOwner: owner,
        name: "BitTorrent",
        unit: { name: "BTT", code: "BTT", magnitude: 6 },
      });
    });
  });
});
