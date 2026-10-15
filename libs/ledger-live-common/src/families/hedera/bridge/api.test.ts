/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getOperationAmountNumber } from "@ledgerhq/ledger-wallet-framework/operation";
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
import { adaptA4OperationToLiveOperation } from "../../../bridge/generic-coin-framework/a4/client/operations";

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
      });
    });

    it("maps an erc20 token to the owner's asset", () => {
      expect(getAssetFromToken?.(erc20Token, "0.0.7654321")).toEqual({
        type: "erc20",
        assetReference: "0x915fe7c00730c08708581e30e27d9c0605be40bd",
        assetOwner: "0.0.7654321",
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
      value = 1,
      hasFailed = false,
    }: {
      type: Operation["type"];
      hash: string;
      fee: number;
      feePayer: string;
      token?: boolean;
      value?: number;
      hasFailed?: boolean;
    }): Operation {
      return {
        id: `${accountId}-${hash}-${type}`,
        hash,
        type,
        value: new BigNumber(value),
        fee: new BigNumber(fee),
        senders: [address],
        recipients: ["0.0.5678"],
        blockHeight: 1,
        blockHash: "block",
        accountId,
        date: new Date("2025-07-07T18:29:08.000Z"),
        hasFailed,
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
          recipients: ["0.0.5678"],
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

    it("adds a native FEES operation sent to the token recipient for a token-only transaction", () => {
      const tokenTransfer = operation({
        type: "OUT",
        hash: "tx1",
        fee: 629386,
        feePayer: address,
        token: true,
      });

      expect(adaptOperations(address, [tokenTransfer])).toEqual([
        tokenTransfer,
        {
          ...tokenTransfer,
          id: `${accountId}-tx1-FEES`,
          type: "FEES",
          value: new BigNumber(629386),
          recipients: ["0.0.5678"],
          extra: {
            feePayer: address,
            transactionId: "0.0.1234-1751912919-510086871",
            ledgerOpType: "FEES",
          },
        },
      ]);
    });

    it("adds nothing for a token-only transaction another account paid for", () => {
      const operations = [
        operation({ type: "IN", hash: "tx1", fee: 629386, feePayer: "0.0.5678", token: true }),
      ];

      expect(adaptOperations(address, operations)).toEqual(operations);
    });

    it("takes a fee another account paid back out of a native OUT value", () => {
      const sponsored = operation({
        type: "OUT",
        hash: "tx1",
        fee: 1056079,
        feePayer: "0.0.5678",
        value: 1066079,
      });

      expect(adaptOperations(address, [sponsored])).toEqual([
        { ...sponsored, value: new BigNumber(10000) },
      ]);
    });

    it("takes a fee another account paid out of a native OUT before a token operation", () => {
      const sponsored = operation({
        type: "OUT",
        hash: "tx1",
        fee: 1056079,
        feePayer: "0.0.5678",
        value: 1066079,
      });
      const tokenTransfer = operation({
        type: "OUT",
        hash: "tx1",
        fee: 1056079,
        feePayer: "0.0.5678",
        token: true,
      });

      expect(adaptOperations(address, [sponsored, tokenTransfer])).toEqual([
        { ...sponsored, value: new BigNumber(10000) },
        tokenTransfer,
      ]);
    });

    it("leaves a failed native OUT another account paid for unchanged", () => {
      const sponsored = operation({
        type: "OUT",
        hash: "tx1",
        fee: 5505725,
        feePayer: "0.0.5678",
        value: 5505725,
        hasFailed: true,
      });

      expect(adaptOperations(address, [sponsored])).toEqual([sponsored]);
    });

    it("takes the fee the account paid out of a native IN value", () => {
      const selfPaid = operation({
        type: "IN",
        hash: "tx1",
        fee: 1056079,
        feePayer: address,
        value: 1066079,
      });

      expect(adaptOperations(address, [selfPaid])).toEqual([
        { ...selfPaid, value: new BigNumber(10000) },
      ]);
    });

    it("leaves a native IN another account paid for unchanged", () => {
      const received = operation({
        type: "IN",
        hash: "tx1",
        fee: 1056079,
        feePayer: "0.0.5678",
        value: 10000,
      });

      expect(adaptOperations(address, [received])).toEqual([received]);
    });

    it("keeps the fee in a native OUT value the account paid for", () => {
      const selfPaid = operation({
        type: "OUT",
        hash: "tx1",
        fee: 1056079,
        feePayer: address,
        value: 1066079,
      });

      expect(adaptOperations(address, [selfPaid])).toEqual([selfPaid]);
    });

    it("credits the account for an A4 contract call that paid it back more than its fee", () => {
      // coin-hedera's value -500,000 becomes a +500,000 transfer part, next to a -100,000 fee part
      const [contractCall] = adaptA4OperationToLiveOperation(accountId, address, {
        block: { hash: "block_hash", height: 1000, time: "2024-01-01T00:00:00Z" },
        tx: { hash: "tx1", details: { ledgerOpType: "CONTRACT_CALL" } },
        assets: {},
        events: {},
        failed: false,
        fees: "100000",
        feeAsset: "native",
        feePayer: address,
        senders: [address],
        recipients: ["0.0.1077627"],
        parts: [
          { type: "transfer", address, asset: "native", amount: "500000" },
          { type: "fee", address, asset: "native", amount: "-100000" },
        ],
      });

      const [adapted] = adaptOperations(address, [contractCall]);

      expect(adapted.type).toBe("CONTRACT_CALL");
      expect(getOperationAmountNumber(adapted)).toEqual(new BigNumber(400000));
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
