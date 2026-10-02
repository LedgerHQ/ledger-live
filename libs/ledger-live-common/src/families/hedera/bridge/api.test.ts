/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { Account, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import hederaBridge, {
  adaptOperations,
  buildAccountShape,
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
      ["tokenAssociate", "token-associate"],
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

    it.each(["send", "tokenAssociate", "claimReward"])("sends no data for %s", mode => {
      expect(buildIntentData({ mode })).toEqual({ type: "none" });
    });

    it.each(["send", undefined])("sends the estimated gas limit of a send (mode %s)", mode => {
      expect(buildIntentData({ mode, feeParameters: { gasLimit: "123456" } })).toEqual({
        type: "erc20",
        gasLimit: 123456n,
      });
    });

    it.each(["tokenAssociate", "claimReward"])("ignores the estimated gas limit on %s", mode => {
      expect(buildIntentData({ mode, feeParameters: { gasLimit: "123456" } })).toEqual({
        type: "none",
      });
    });
  });

  describe("describeOptimisticOperation", () => {
    it("returns undefined for a mode it does not describe", () => {
      expect(describeOptimisticOperation("send", {} as Account, {})).toBeUndefined();
    });

    it("returns undefined for an account with no staking resources", () => {
      expect(describeOptimisticOperation("claimReward", {} as Account, {})).toBeUndefined();
      expect(
        describeOptimisticOperation(
          "claimReward",
          { stakingResources: undefined } as unknown as Account,
          {},
        ),
      ).toBeUndefined();
    });

    it("uses the pending rewards as the claim's value", () => {
      const account = {
        stakingResources: { pendingRewardsBalance: new BigNumber(42) },
      } as unknown as Account;

      expect(describeOptimisticOperation("claimReward", account, {})).toEqual({
        value: new BigNumber(42),
      });
    });

    it("tags an association with its token id", () => {
      expect(
        describeOptimisticOperation("tokenAssociate", {} as Account, {
          assetReference: "0.0.1234567",
        }),
      ).toEqual({ extra: { associatedTokenId: "0.0.1234567" } });
    });

    it.each([
      ["delegate", null, 3],
      ["redelegate", 5, 3],
      ["undelegate", 5, null],
    ])("tags a %s with its previous and target nodes", (mode, previous, target) => {
      const account = {
        hederaResources: { delegation: previous === null ? null : { nodeId: previous } },
      } as unknown as Account;

      expect(describeOptimisticOperation(mode, account, { valId: "3" })).toEqual({
        extra: { targetStakingNodeId: target, previousStakingNodeId: previous },
      });
    });
  });

  describe("buildAccountShape", () => {
    const accountInfo = {
      type: "hedera",
      maxAutomaticTokenAssociations: -1,
      stakedNodeId: 3,
      balance: 1_000_000_000,
      pendingReward: 42,
    };

    it("returns undefined without Hedera account info", () => {
      expect(buildAccountShape("0.0.1234")).toBeUndefined();
      expect(buildAccountShape("0.0.1234", { type: "none" })).toBeUndefined();
    });

    it("maps a staking account's info to hederaResources", () => {
      expect(buildAccountShape("0.0.1234", accountInfo)).toEqual({
        hederaResources: {
          maxAutomaticTokenAssociations: -1,
          isAutoTokenAssociationEnabled: true,
          delegation: {
            nodeId: 3,
            delegated: new BigNumber(1_000_000_000),
            pendingReward: new BigNumber(42),
          },
        },
      });
    });

    it("maps a non-staking account with limited auto association", () => {
      expect(
        buildAccountShape("0.0.1234", {
          ...accountInfo,
          maxAutomaticTokenAssociations: 10,
          stakedNodeId: null,
        }),
      ).toEqual({
        hederaResources: {
          maxAutomaticTokenAssociations: 10,
          isAutoTokenAssociationEnabled: false,
          delegation: null,
        },
      });
    });

    it("keeps a delegation to node 0", () => {
      const shape = buildAccountShape("0.0.1234", { ...accountInfo, stakedNodeId: 0 });

      expect(shape?.hederaResources).toMatchObject({ delegation: { nodeId: 0 } });
    });

    it("drops the delegation of an undelegated account (node -1)", () => {
      const shape = buildAccountShape("0.0.1234", { ...accountInfo, stakedNodeId: -1 });

      expect(shape?.hederaResources).toMatchObject({ delegation: null });
    });
  });

  describe("adaptOperations", () => {
    const address = "0.0.1234";
    const accountId = "js:2:hedera:0.0.1234:hederaBip44";
    const tokenContract = "0.0.4794920";

    function operation({
      type,
      hash,
      fee,
      feePayer,
      token,
    }: {
      type: Operation["type"];
      hash: string;
      fee: number;
      feePayer: string;
      token?: boolean;
    }): Operation {
      return {
        id: `${accountId}-${hash}-${type}`,
        hash,
        type,
        value: new BigNumber(1),
        fee: new BigNumber(fee),
        senders: [address],
        recipients: ["0.0.5678"],
        blockHeight: 1,
        blockHash: "block",
        accountId,
        date: new Date("2025-07-07T18:29:08.000Z"),
        hasFailed: false,
        extra: {
          feePayer,
          transactionId: "0.0.1234-1751912919-510086871",
          ...(token && {
            assetReference: tokenContract,
            assetOwner: address,
            assetAmount: "1",
            ledgerOpType: type,
          }),
        },
      };
    }

    it("adds a native FEES operation for a token transfer whose native operation carries no fee", () => {
      const reward = operation({ type: "REWARD", hash: "tx1", fee: 0, feePayer: address });
      const tokenTransfer = operation({
        type: "OUT",
        hash: "tx1",
        fee: 629386,
        feePayer: address,
        token: true,
      });

      expect(adaptOperations(address, [reward, tokenTransfer])).toEqual([
        reward,
        tokenTransfer,
        {
          ...tokenTransfer,
          id: `${accountId}-tx1-FEES`,
          type: "FEES",
          value: new BigNumber(629386),
          recipients: [tokenContract],
          extra: {
            feePayer: address,
            transactionId: "0.0.1234-1751912919-510086871",
            ledgerOpType: "FEES",
          },
        },
      ]);
    });

    it("adds nothing when another account paid the fee", () => {
      const operations = [
        operation({ type: "REWARD", hash: "tx1", fee: 0, feePayer: "0.0.5678" }),
        operation({ type: "IN", hash: "tx1", fee: 629386, feePayer: "0.0.5678", token: true }),
      ];

      expect(adaptOperations(address, operations)).toEqual(operations);
    });

    it("adds nothing when a native operation already carries the fee", () => {
      const operations = [
        operation({ type: "OUT", hash: "tx1", fee: 629386, feePayer: address }),
        operation({ type: "OUT", hash: "tx1", fee: 629386, feePayer: address, token: true }),
      ];

      expect(adaptOperations(address, operations)).toEqual(operations);
    });

    it("adds nothing for a token-only transaction, whose FEES parent the bridge builds", () => {
      const operations = [
        operation({ type: "OUT", hash: "tx1", fee: 629386, feePayer: address, token: true }),
      ];

      expect(adaptOperations(address, operations)).toEqual(operations);
    });

    it("only adds the FEES operation to the transaction that needs it", () => {
      const operations = [
        operation({ type: "REWARD", hash: "tx1", fee: 0, feePayer: address }),
        operation({ type: "OUT", hash: "tx1", fee: 629386, feePayer: address, token: true }),
        operation({ type: "OUT", hash: "tx2", fee: 100, feePayer: address }),
      ];

      expect(adaptOperations(address, operations).map(op => op.id)).toEqual([
        `${accountId}-tx1-REWARD`,
        `${accountId}-tx1-OUT`,
        `${accountId}-tx1-FEES`,
        `${accountId}-tx2-OUT`,
      ]);
    });
  });

  describe("bridge surface", () => {
    it("adapts the synced operations", () => {
      expect(hederaBridge(currency).adaptOperations).toBe(adaptOperations);
    });

    it("leaves the operation list to the account shape", () => {
      expect(hederaBridge(currency).shouldMergeOps).toBe(false);
    });
  });
});
