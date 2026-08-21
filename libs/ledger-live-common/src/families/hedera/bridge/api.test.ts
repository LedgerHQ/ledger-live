/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AccountInfo, AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account, CryptoAssetsStore, StakingResources } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import hederaBridge, {
  buildAccountShape,
  buildIntentData,
  computeIntentType,
  describeOptimisticOperation,
  getAssetFromToken,
  getTokenFromAsset,
} from "./api";

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore");

const hederaToken = {
  id: "hedera/hts/0.0.1234567",
  tokenType: "hts",
  contractAddress: "0.0.1234567",
  name: "Test Token",
  units: [{ name: "TEST", code: "TEST", magnitude: 8 }],
} as unknown as TokenCurrency;

const hedera = getCryptoCurrencyById("hedera");

describe("hedera bridge", () => {
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

    it("returns undefined for a native asset", async () => {
      const asset: AssetInfo = { type: "native" };

      expect(await getTokenFromAsset(hedera, asset)).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("returns undefined when the asset has no assetReference", async () => {
      const asset = { type: "hts" } as AssetInfo;

      expect(await getTokenFromAsset(hedera, asset)).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("resolves an HTS token by its contract id", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(hederaToken);
      const asset: AssetInfo = { type: "hts", assetReference: "0.0.1234567" };

      const result = await getTokenFromAsset(hedera, asset);

      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith("0.0.1234567", hedera.id);
      expect(result).toBe(hederaToken);
    });
  });

  describe("getAssetFromToken", () => {
    it("maps a token to AssetInfo, owner-scoped", () => {
      const result = getAssetFromToken(hederaToken, "0.0.7654321");

      expect(result).toEqual({
        type: "hts",
        assetReference: "0.0.1234567",
        assetOwner: "0.0.7654321",
        name: "Test Token",
        unit: { name: "TEST", code: "TEST", magnitude: 8 },
      });
    });
  });

  describe("describeOptimisticOperation", () => {
    it("returns undefined for a non-claimReward mode", () => {
      expect(describeOptimisticOperation("send", {} as Account)).toBeUndefined();
    });

    it("returns undefined for claimReward when the account has no staking resources", () => {
      expect(describeOptimisticOperation("claimReward", {} as Account)).toBeUndefined();
    });

    it("pins the value to the pending rewards balance for claimReward", () => {
      const account = {
        stakingResources: {
          pendingRewardsBalance: new BigNumber(42),
        } as StakingResources,
      } as Account;

      expect(describeOptimisticOperation("claimReward", account)).toEqual({
        value: new BigNumber(42),
      });
    });
  });

  describe("computeIntentType", () => {
    it("defaults to send when no mode is set", () => {
      expect(computeIntentType({})).toBe("send");
    });

    it.each(["send", "delegate", "undelegate", "redelegate", "claimReward"])(
      "passes the %s mode through unchanged",
      mode => {
        expect(computeIntentType({ mode })).toBe(mode);
      },
    );

    it("translates tokenAssociate to the legacy token-associate string craftTransaction/mapIntentToSDKOperation dispatch on", () => {
      expect(computeIntentType({ mode: "tokenAssociate" })).toBe("token-associate");
    });

    it("does not translate changeTrust — it stays Stellar's own mode, not association's", () => {
      expect(computeIntentType({ mode: "changeTrust" })).toBe("changeTrust");
    });
  });

  describe("buildIntentData", () => {
    // Without this, `logic/craftTransaction.ts`'s staking branch reads `intent.data.stakingNodeId`
    // (never `intent.valId`) and always gets `undefined` — the crafted transaction would neither set
    // nor clear the account's staked node, silently no-op-ing the whole flow (LIVE-36151).
    it.each(["delegate", "redelegate"])(
      "maps a %s transaction's valId to a numeric stakingNodeId",
      mode => {
        expect(buildIntentData({ mode, valId: "3" })).toEqual({
          type: "staking",
          stakingNodeId: 3,
        });
      },
    );

    it("maps an undelegate transaction with no valId to a null stakingNodeId (clears the staked node)", () => {
      expect(buildIntentData({ mode: "undelegate" })).toEqual({
        type: "staking",
        stakingNodeId: null,
      });
    });

    it("maps a missing/empty valId on delegate to a null stakingNodeId", () => {
      expect(buildIntentData({ mode: "delegate", valId: "" })).toEqual({
        type: "staking",
        stakingNodeId: null,
      });
    });

    it.each(["send", "tokenAssociate", "claimReward"])(
      "returns type none for non-staking mode %s",
      mode => {
        expect(buildIntentData({ mode })).toEqual({ type: "none" });
      },
    );

    // LIVE-36276 item 4: without this, `logic/craftTransaction.ts`'s erc20 branch never sees
    // `txIntent.data.gasLimit` and always falls back to `DEFAULT_GAS_LIMIT` regardless of what fee
    // estimation actually computed. 123456 is deliberately not that default (100_000).
    it("maps a send transaction's gasLimit to a bigint erc20 intent data", () => {
      expect(buildIntentData({ mode: "send", gasLimit: new BigNumber(123456) })).toEqual({
        type: "erc20",
        gasLimit: 123456n,
      });
    });

    it("returns type none for a send transaction with no gasLimit (native/HTS sends)", () => {
      expect(buildIntentData({ mode: "send" })).toEqual({ type: "none" });
    });
  });

  describe("buildAccountShape", () => {
    it("returns undefined when accountInfo is missing", () => {
      expect(buildAccountShape("0.0.12345")).toBeUndefined();
    });

    it("returns undefined for an accountInfo from another family", () => {
      expect(buildAccountShape("0.0.12345", { type: "tron" } as AccountInfo)).toBeUndefined();
    });

    it("maps a delegating account's info onto hederaResources", () => {
      const accountInfo = {
        type: "hedera",
        maxAutomaticTokenAssociations: -1,
        stakedNodeId: 3,
        balance: 100000000,
        pendingReward: 1234,
      } as AccountInfo;

      expect(buildAccountShape("0.0.12345", accountInfo)).toEqual({
        hederaResources: {
          maxAutomaticTokenAssociations: -1,
          isAutoTokenAssociationEnabled: true,
          delegation: {
            nodeId: 3,
            delegated: new BigNumber(100000000),
            pendingReward: new BigNumber(1234),
          },
        },
      });
    });

    it("maps a non-delegating account's info to a null delegation", () => {
      const accountInfo = {
        type: "hedera",
        maxAutomaticTokenAssociations: 0,
        stakedNodeId: null,
        balance: 500,
        pendingReward: 0,
      } as AccountInfo;

      expect(buildAccountShape("0.0.12345", accountInfo)).toEqual({
        hederaResources: {
          maxAutomaticTokenAssociations: 0,
          isAutoTokenAssociationEnabled: false,
          delegation: null,
        },
      });
    });
  });

  describe("hederaBridge", () => {
    it("declares staking supported and leaves usesStakingPositions unset", () => {
      const bridge = hederaBridge(hedera);

      expect(bridge.stakingSupported).toBe(true);
      expect(bridge.usesStakingPositions).toBeUndefined();
    });

    it("exposes the token mappers bound to the currency", async () => {
      const bridge = hederaBridge(hedera);
      const mockFindTokenByAddressInCurrency = jest.fn().mockResolvedValue(hederaToken);
      (
        jest.requireMock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore") as {
          getCryptoAssetsStore: jest.Mock;
        }
      ).getCryptoAssetsStore.mockReturnValue({
        findTokenByAddressInCurrency: mockFindTokenByAddressInCurrency,
      });

      const result = await bridge.getTokenFromAsset?.({
        type: "hts",
        assetReference: "0.0.1234567",
      });

      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith("0.0.1234567", hedera.id);
      expect(result).toBe(hederaToken);
    });
  });
});
