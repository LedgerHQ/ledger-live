/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import hederaBridge, {
  buildIntentData,
  computeIntentType,
  describeOptimisticOperation,
  getAddressesForPublicKey,
  keyControlsAccount,
} from "./api";

const getAccountsForPublicKeyMock = jest.fn();
jest.mock("@ledgerhq/coin-hedera/network/api", () => ({
  apiClient: {
    getAccountsForPublicKey: (...a: unknown[]) => getAccountsForPublicKeyMock(...a),
  },
}));

const config = { apiUrls: { mirrorNode: "https://mirror.test" } };
jest.mock("../../../config", () => ({
  getCurrencyConfiguration: () => config,
}));

const currency = getCryptoCurrencyById("hedera");

const mockFindTokenByAddressInCurrency = jest.fn();
setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: mockFindTokenByAddressInCurrency,
  getTokensSyncHash: async () => "",
});

const htsToken = {
  tokenType: "hts",
  contractAddress: "0.0.1234567",
  name: "Test Token",
  units: [{ name: "TEST", code: "TEST", magnitude: 8 }],
} as unknown as TokenCurrency;

const erc20Token = {
  tokenType: "erc20",
  contractAddress: "0x915fe7c00730c08708581e30e27d9c0605be40bd",
  name: "Test ERC20 Token",
  units: [{ name: "TEST2", code: "TEST2", magnitude: 8 }],
} as unknown as TokenCurrency;

describe("hedera bridge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAddressesForPublicKey", () => {
    it("returns the accounts the mirror node holds for the device key", async () => {
      getAccountsForPublicKeyMock.mockResolvedValue([{ account: "0.0.1" }, { account: "0.0.2" }]);

      const addresses = await getAddressesForPublicKey(currency, "pk");

      expect(addresses).toEqual(["0.0.1", "0.0.2"]);
      expect(getAccountsForPublicKeyMock).toHaveBeenCalledTimes(1);
      expect(getAccountsForPublicKeyMock).toHaveBeenCalledWith({
        configOrCurrencyId: config,
        publicKey: "pk",
      });
    });

    it("returns no address when the key controls no account", async () => {
      getAccountsForPublicKeyMock.mockResolvedValue([]);

      const addresses = await getAddressesForPublicKey(currency, "pk");

      expect(addresses).toEqual([]);
    });
  });

  it.each([
    ["pk", true],
    ["other-pk", false],
  ])("keyControlsAccount(%s) is %s for an account seeded by pk", (publicKey, expected) => {
    const account = { seedIdentifier: "pk" } as Account;

    expect(keyControlsAccount(publicKey, account)).toBe(expected);
  });

  it("looks up addresses by the derived public key", async () => {
    getAccountsForPublicKeyMock.mockResolvedValue([{ account: "0.0.1" }]);

    const addresses = await hederaBridge(currency).addressLookup?.getAddresses({
      address: "",
      path: "44/3030",
      publicKey: "pk",
    });

    expect(addresses).toEqual(["0.0.1"]);
    expect(getAccountsForPublicKeyMock).toHaveBeenCalledTimes(1);
    expect(getAccountsForPublicKeyMock).toHaveBeenCalledWith(
      expect.objectContaining({ publicKey: "pk" }),
    );
  });

  describe("getTokenFromAsset", () => {
    const { getTokenFromAsset } = hederaBridge(currency);

    it("returns undefined for the native asset", async () => {
      expect(await getTokenFromAsset?.({ type: "native" })).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("returns undefined for an asset with no reference", async () => {
      expect(await getTokenFromAsset?.({ type: "hts" } as AssetInfo)).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it.each([
      ["hts", htsToken, "0.0.1234567"],
      ["erc20", erc20Token, "0x915fe7c00730c08708581e30e27d9c0605be40bd"],
    ])("finds an %s token by its address", async (type, token, address) => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(token);

      const result = await getTokenFromAsset?.({ type, assetReference: address });

      expect(result).toBe(token);
      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledTimes(1);
      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(address, "hedera");
    });
  });

  describe("getAssetFromToken", () => {
    const { getAssetFromToken } = hederaBridge(currency);

    it("maps an hts token to the owner's asset", () => {
      expect(getAssetFromToken?.(htsToken, "0.0.7654321")).toEqual({
        type: "hts",
        assetReference: "0.0.1234567",
        assetOwner: "0.0.7654321",
        name: "Test Token",
        unit: { name: "TEST", code: "TEST", magnitude: 8 },
      });
    });

    it("maps an erc20 token to the owner's asset", () => {
      expect(getAssetFromToken?.(erc20Token, "0.0.7654321")).toEqual({
        type: "erc20",
        assetReference: "0x915fe7c00730c08708581e30e27d9c0605be40bd",
        assetOwner: "0.0.7654321",
        name: "Test ERC20 Token",
        unit: { name: "TEST2", code: "TEST2", magnitude: 8 },
      });
    });
  });

  describe("computeIntentType", () => {
    it.each([
      [undefined, "send"],
      ["send", "send"],
      ["delegate", "delegate"],
      ["undelegate", "undelegate"],
      ["redelegate", "redelegate"],
      ["claimReward", "claim-rewards"],
    ])("maps mode %s to %s", (mode, expected) => {
      expect(computeIntentType({ mode })).toBe(expected);
    });

    it("throws for a mode Hedera does not support", () => {
      expect(() => computeIntentType({ mode: "changeTrust" })).toThrow(
        "Unsupported Hedera transaction mode: changeTrust",
      );
    });
  });

  describe("buildIntentData", () => {
    it.each(["delegate", "redelegate"])("sends the %s node id as a number", mode => {
      expect(buildIntentData({ mode, valId: "3" })).toEqual({ type: "staking", stakingNodeId: 3 });
    });

    it("clears the staked node on undelegate, even with a node id set", () => {
      expect(buildIntentData({ mode: "undelegate", valId: "3" })).toEqual({
        type: "staking",
        stakingNodeId: null,
      });
    });

    it("sends a null node id on delegate with no node id", () => {
      expect(buildIntentData({ mode: "delegate", valId: "" })).toEqual({
        type: "staking",
        stakingNodeId: null,
      });
    });

    it.each(["send", "claimReward"])("sends no data for %s", mode => {
      expect(buildIntentData({ mode })).toEqual({ type: "none" });
    });
  });

  describe("describeOptimisticOperation", () => {
    it("returns undefined for a mode other than claimReward", () => {
      expect(describeOptimisticOperation("send", {} as Account)).toBeUndefined();
    });

    it("returns undefined for an account with no staking resources", () => {
      expect(describeOptimisticOperation("claimReward", {} as Account)).toBeUndefined();
      expect(
        describeOptimisticOperation("claimReward", {
          stakingResources: undefined,
        } as unknown as Account),
      ).toBeUndefined();
    });

    it("uses the pending rewards as the claim's value", () => {
      const account = {
        stakingResources: { pendingRewardsBalance: new BigNumber(42) },
      } as unknown as Account;

      expect(describeOptimisticOperation("claimReward", account)).toEqual({
        value: new BigNumber(42),
      });
    });
  });

  describe("bridge surface", () => {
    it("leaves the operation list to the account shape", () => {
      expect(hederaBridge(currency).shouldMergeOps).toBe(false);
    });
  });
});
