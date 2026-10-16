import { getCryptoCurrencyById, CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import {
  getCryptoAssetsStore,
  setCryptoAssetsStore,
} from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import type { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { CHAIN_ID } from "@ledgerhq/coin-evm/config";
import { STAKING_CONTRACTS } from "@ledgerhq/coin-evm/staking";
import evmBridge, {
  computeIntentType,
  enrichStakingResources,
  getAccountReadiness,
  getAssetFromToken,
  getTokenFromAsset,
  refreshOperations,
} from "./api";
import { legacyChainReads } from "./legacyChainReads";

// The staking registry is keyed on the chain id, read from the currency config.
const configure = (node: unknown) =>
  LiveConfig.setConfig({
    config_currency_sei_evm: { type: "object", default: { chainId: CHAIN_ID.SEI_EVM, node } },
  } as never);

const redelegate = (fields: Partial<Operation>): Operation =>
  ({
    hash: "0xredelegate",
    type: "REDELEGATE",
    hasFailed: false,
    date: new Date(),
    recipients: [],
    extra: {},
    ...fields,
  }) as Operation;

const pending = (fields: Partial<Operation> = {}): Operation =>
  ({
    hash: "0xpending",
    type: "OUT",
    value: new BigNumber(10),
    fee: new BigNumber(1),
    blockHeight: null,
    blockHash: null,
    date: new Date("2026-01-01T00:00:00.000Z"),
    transactionSequenceNumber: new BigNumber(4),
    ...fields,
  }) as Operation;

const chainReads = () => ({
  getAccountInfo: jest.fn(),
  call: jest.fn(),
  getNextSequence: jest.fn(),
  getAddressesForPublicKey: jest.fn(),
  getTransactionInfo: jest.fn(),
});

describe("evm bridge", () => {
  const ethereum = getCryptoCurrencyById("ethereum");
  const sonic = getCryptoCurrencyById("sonic");
  const flare = getCryptoCurrencyById("flare");
  const seiEvm = getCryptoCurrencyById("sei_evm");

  beforeAll(() => {
    const mockStore: Parameters<typeof setCryptoAssetsStore>[0] = {
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async (address: string, currencyId: string) => {
        const normalizedAddress = address.toLowerCase();

        if (
          normalizedAddress === "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" &&
          currencyId === "ethereum"
        ) {
          return {
            type: "TokenCurrency",
            id: TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
            contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
            tokenType: "erc20",
            name: "USD Coin",
            ticker: "USDC",
            delisted: false,
            disableCountervalue: false,
            units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
          };
        }

        if (
          normalizedAddress === "0x29219dd400f2bf60e5a23d13be72b486d4038894" &&
          currencyId === "sonic"
        ) {
          return {
            type: "TokenCurrency",
            id: TokenCurrencyIdSchema.parse(
              "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894",
            ),
            contractAddress: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
            parentCurrencyId: CryptoCurrencyIdSchema.parse("sonic"),
            tokenType: "erc20",
            name: "Bridged USDC (Sonic Labs)",
            ticker: "USDC",
            delisted: false,
            disableCountervalue: false,
            units: [{ name: "Bridged USDC (Sonic Labs)", code: "USDC", magnitude: 6 }],
          };
        }

        return undefined;
      },
      getTokensSyncHash: async () => "",
    };

    setCryptoAssetsStore(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("computes the token of a known asset", async () => {
    await expect(
      getTokenFromAsset(ethereum, {
        type: "erc20",
        assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      }),
    ).resolves.toMatchObject({
      id: "ethereum/erc20/usd__coin",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
    });

    await expect(
      getTokenFromAsset(sonic, {
        type: "erc20",
        assetReference: "0x29219dd400f2bf60e5a23d13be72b486d4038894",
      }),
    ).resolves.toMatchObject({
      id: "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894",
      contractAddress: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
      name: "Bridged USDC (Sonic Labs)",
    });
  });

  it("does not compute the token of an unknown asset", async () => {
    const findTokenByAddressInCurrency = jest.spyOn(
      getCryptoAssetsStore(),
      "findTokenByAddressInCurrency",
    );

    await expect(
      getTokenFromAsset(ethereum, {
        type: "token",
        assetReference: "unknown-reference",
      }),
    ).resolves.toBeUndefined();

    expect(findTokenByAddressInCurrency).toHaveBeenCalledWith("unknown-reference", "ethereum");
  });

  it("computes the asset of an EVM token", () => {
    const token: TokenCurrency = {
      type: "TokenCurrency",
      id: TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
      parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
      tokenType: "erc20",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
      ticker: "USDC",
      delisted: false,
      disableCountervalue: false,
      units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
    };

    expect(getAssetFromToken(ethereum, token, "owner")).toEqual({
      assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      assetOwner: "owner",
      name: "USD Coin",
      type: "erc20",
      unit: {
        code: "USDC",
        magnitude: 6,
        name: "USD Coin",
      },
    });
  });

  it("normalizes checksum when computing an EVM asset", () => {
    const token: TokenCurrency = {
      type: "TokenCurrency",
      id: TokenCurrencyIdSchema.parse("flare/erc20/fxrp"),
      parentCurrencyId: CryptoCurrencyIdSchema.parse("flare"),
      tokenType: "erc20",
      contractAddress: "0xad552a648c74d49e10027ab8a618a3ad4901c5be",
      name: "FXRP",
      ticker: "FXRP",
      delisted: false,
      disableCountervalue: false,
      units: [{ name: "FXRP", code: "FXRP", magnitude: 6 }],
    };

    expect(getAssetFromToken(flare, token, "owner")).toEqual({
      assetReference: "0xAd552A648C74D49E10027AB8a618A3ad4901c5bE",
      assetOwner: "owner",
      name: "FXRP",
      type: "erc20",
      unit: {
        code: "FXRP",
        magnitude: 6,
        name: "FXRP",
      },
    });
  });

  it("throws if token parent currency does not match", () => {
    const token: TokenCurrency = {
      type: "TokenCurrency",
      id: TokenCurrencyIdSchema.parse("usdc_on_ethereum"),
      parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
      tokenType: "erc20",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      name: "USD Coin",
      ticker: "USDC",
      delisted: false,
      disableCountervalue: false,
      units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
    };

    expect(() => getAssetFromToken(sonic, token, "owner")).toThrow(
      "'usdc_on_ethereum' is not a valid token for 'sonic'",
    );
  });

  describe("computeIntentType", () => {
    it.each([
      ["send-eip1559", "a 'send-eip1559' mode", { mode: "send-eip1559" }],
      ["send-eip1559", "a 'send' mode and '2' type", { mode: "send", type: 2 }],
      ["send-legacy", "a 'send-legacy' mode", { mode: "send-legacy" }],
      ["send-legacy", "a 'send' mode and '0' type", { mode: "send", type: 0 }],
      ["send-legacy", "a 'send' mode no type", { mode: "send" }],
      ["staking-eip1559", "a 'delegate' mode and '2' type", { mode: "delegate", type: 2 }],
      ["staking-eip1559", "a 'redelegate' mode and '2' type", { mode: "redelegate", type: 2 }],
      ["staking-eip1559", "a 'undelegate' mode and '2' type", { mode: "undelegate", type: 2 }],
      ["staking-eip1559", "a 'claimReward' mode and '2' type", { mode: "claimReward", type: 2 }],
      ["staking-legacy", "a 'delegate' mode", { mode: "delegate" }],
      ["staking-legacy", "a 'redelegate' mode", { mode: "redelegate" }],
      ["staking-legacy", "a 'undelegate' mode", { mode: "undelegate" }],
      ["staking-legacy", "a 'claimReward' mode", { mode: "claimReward" }],
    ])("detects a '%s' type from %s", (expectedType, _s, transaction) => {
      expect(computeIntentType(transaction)).toEqual(expectedType);
    });

    it("throws on unsupported transaction mode", () => {
      expect(() => computeIntentType({ mode: undefined })).toThrow(
        "Unsupported transaction mode: undefined",
      );
      expect(() => computeIntentType({ mode: "any" })).toThrow(
        "Unsupported transaction mode: 'any'",
      );
    });
  });

  describe("getBalanceOptions", () => {
    let bridgeApi: BridgeApi;

    beforeAll(() => {
      bridgeApi = evmBridge(ethereum);
    });

    it("should return a defined BalanceOptions", () => {
      expect(bridgeApi.balanceOptions).toBeDefined();

      const result = bridgeApi.balanceOptions;
      expect(result).toEqual({
        includeAssets: expect.any(Function),
      });
    });

    it("should accept supported tokens from includeAssets", async () => {
      const supportedAsset = {
        type: "erc20",
        assetReference: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      };

      expect(bridgeApi.balanceOptions).toBeDefined();
      const balanceOptions = bridgeApi.balanceOptions;

      expect(await balanceOptions!.includeAssets!(supportedAsset)).toEqual(true);
    });

    it("should reject unsupported tokens from includeAssets", async () => {
      const unsupportedAsset = {
        type: "erc20",
        assetReference: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
      };

      const balanceOptions = bridgeApi.balanceOptions;
      expect(await balanceOptions!.includeAssets!(unsupportedAsset)).toEqual(false);
    });

    it("should not filter native asset from includeAssets", async () => {
      const findTokenByAddressInCurrencySpy = jest.spyOn(
        getCryptoAssetsStore(),
        "findTokenByAddressInCurrency",
      );

      const nativeAsset = {
        type: "native",
        name: "ethereum",
      };

      const balanceOptions = bridgeApi.balanceOptions;
      expect(await balanceOptions!.includeAssets!(nativeAsset)).toEqual(true);

      expect(findTokenByAddressInCurrencySpy).not.toHaveBeenCalled();
    });
  });

  describe("bridge surface", () => {
    it("always exposes validateTransaction", () => {
      expect(evmBridge(ethereum).validateTransaction).toEqual(expect.any(Function));
    });

    it("exposes stakingSupported only for staking-configured currencies", () => {
      // The staking registry is keyed on the chain id, read from the currency config.
      LiveConfig.setConfig({
        config_currency_ethereum: { type: "object", default: { chainId: CHAIN_ID.ETHEREUM } },
        config_currency_sei_evm: { type: "object", default: { chainId: CHAIN_ID.SEI_EVM } },
      } as never);
      expect(evmBridge(ethereum)).not.toHaveProperty("stakingSupported");
      expect(evmBridge(seiEvm).stakingSupported).toBe(true);
    });

    it("exposes refreshOperations only for explorer-less chains", () => {
      // The bridge gates refreshOperations on `getCurrencyConfiguration` (the live-common
      // LiveConfig source), read at bridge-assembly time — not on coin-evm's setCoinConfig.
      LiveConfig.setConfig({
        config_currency_ethereum: { type: "object", default: { explorer: { type: "ledger" } } },
      } as never);
      expect(evmBridge(ethereum)).not.toHaveProperty("refreshOperations");

      LiveConfig.setConfig({
        config_currency_ethereum: { type: "object", default: { explorer: { type: "none" } } },
      } as never);
      expect(evmBridge(ethereum).refreshOperations).toEqual(expect.any(Function));
    });

    it("exposes getAccountReadiness only for sei_evm", () => {
      expect(evmBridge(ethereum)).not.toHaveProperty("getAccountReadiness");
      expect(evmBridge(seiEvm).getAccountReadiness).toEqual(expect.any(Function));
    });

    it("declares the reads its legacy path makes beyond coin-evm", () => {
      expect(evmBridge(ethereum).legacyChainReads).toBe(legacyChainReads);
    });
  });

  describe("getAccountReadiness", () => {
    const address = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    const precompile = STAKING_CONTRACTS[CHAIN_ID.SEI_EVM]!.apiConfig!.precompileAddress!;
    const contract = new ethers.Interface([precompile.abi]);
    const { name } = ethers.FunctionFragment.from(precompile.abi);
    const answering = (cosmosAddress: string) =>
      contract.encodeFunctionResult(name, [cosmosAddress]);

    beforeEach(() => configure({ type: "external", uri: "https://sei.rpc" }));

    it("asks the address precompile through the chain reads, and is ready once associated", async () => {
      const chain = chainReads();
      chain.call.mockResolvedValue(answering("sei1linked"));

      await expect(getAccountReadiness(seiEvm, address, chain)).resolves.toEqual({ ready: true });
      expect(chain.call).toHaveBeenCalledWith({
        to: precompile.address,
        data: contract.encodeFunctionData(name, [address]),
      });
    });

    it.each([
      [
        "an empty Cosmos address",
        (chain: ReturnType<typeof chainReads>) => chain.call.mockResolvedValue(answering("")),
      ],
      [
        "a revert or an RPC failure",
        (chain: ReturnType<typeof chainReads>) =>
          chain.call.mockRejectedValue(new Error("execution reverted")),
      ],
      [
        "an undecodable answer",
        (chain: ReturnType<typeof chainReads>) => chain.call.mockResolvedValue("0x"),
      ],
    ])("is not ready ('activationRequired') on %s", async (_label, answer) => {
      const chain = chainReads();
      answer(chain);

      await expect(getAccountReadiness(seiEvm, address, chain)).resolves.toEqual({
        ready: false,
        reason: "activationRequired",
      });
    });

    it("keeps the readiness when the path cannot make the call", async () => {
      const chain = chainReads();
      const unsupported = new ChainReadUnsupportedError("call is not served");
      chain.call.mockRejectedValue(unsupported);

      await expect(getAccountReadiness(seiEvm, address, chain)).rejects.toBe(unsupported);
    });

    it("is ready without an external node or a precompile to ask", async () => {
      const chain = chainReads();
      configure({ type: "ledger", explorerId: "sei" });
      await expect(getAccountReadiness(seiEvm, address, chain)).resolves.toEqual({ ready: true });

      LiveConfig.setConfig({
        config_currency_ethereum: {
          type: "object",
          default: {
            chainId: CHAIN_ID.ETHEREUM,
            node: { type: "external", uri: "https://eth.rpc" },
          },
        },
      } as never);
      await expect(getAccountReadiness(ethereum, address, chain)).resolves.toEqual({
        ready: true,
      });
      expect(chain.call).not.toHaveBeenCalled();
    });
  });

  describe("enrichStakingResources", () => {
    const address = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
    const staking = STAKING_CONTRACTS[CHAIN_ID.SEI_EVM]!;
    const contract = new ethers.Interface([
      `function ${staking.functions.redelegate}(string src, string dst, uint256 amount)`,
    ]);
    const payload = (src: string, dst: string) =>
      contract.encodeFunctionData(staking.functions.redelegate!, [src, dst, 5n]);
    const base = {
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(1),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    };

    beforeEach(() => {
      LiveConfig.setConfig({
        config_currency_sei_evm: { type: "object", default: { chainId: CHAIN_ID.SEI_EVM } },
        config_currency_ethereum: { type: "object", default: { chainId: CHAIN_ID.ETHEREUM } },
      } as never);
    });

    it("merges the reported redelegations with those decoded from the operations, deduplicated", async () => {
      const chain = chainReads();
      chain.getAccountInfo.mockResolvedValue({
        type: "none",
        redelegations: [
          {
            validatorSrcAddress: "seivaloper1a",
            validatorDstAddress: "seivaloper1b",
            amount: "1000",
            completionDate: "2099-01-01T00:00:00.000Z",
          },
        ],
      });
      chain.getTransactionInfo.mockImplementation(async (hash: string) =>
        hash === "0xfetched"
          ? { hash, block: null, data: payload("seivaloper1c", "seivaloper1d") }
          : undefined,
      );

      const result = await enrichStakingResources(
        seiEvm,
        address,
        [
          // cached payload, same pair as the reported one: deduplicated
          redelegate({
            hash: "0xcached",
            extra: { contractPayload: payload("seivaloper1a", "seivaloper1b") },
          }),
          // payload read through the chain
          redelegate({ hash: "0xfetched" }),
          // payload unknown to the chain: left out, never fetched by coin-evm
          redelegate({ hash: "0xunknown", extra: undefined }),
          // not eligible: failed, completed, or not a redelegation
          redelegate({ hash: "0xfailed", hasFailed: true }),
          redelegate({ hash: "0xold", date: new Date("2000-01-01T00:00:00.000Z") }),
          redelegate({ hash: "0xdelegate", type: "DELEGATE" }),
        ],
        base,
        chain,
      );

      expect(chain.getAccountInfo).toHaveBeenCalledWith(address);
      expect(chain.getTransactionInfo.mock.calls.map(([hash]) => hash).sort()).toEqual([
        "0xfetched",
        "0xunknown",
      ]);
      expect(result.delegatedBalance).toBe(base.delegatedBalance);
      expect(result.redelegations).toEqual([
        {
          validatorSrcAddress: "seivaloper1a",
          validatorDstAddress: "seivaloper1b",
          amount: new BigNumber(1000),
          completionDate: new Date("2099-01-01T00:00:00.000Z"),
        },
        expect.objectContaining({
          validatorSrcAddress: "seivaloper1c",
          validatorDstAddress: "seivaloper1d",
        }),
      ]);
    });

    it("reports none when the account metadata carries none or cannot be read", async () => {
      const chain = chainReads();
      chain.getAccountInfo.mockResolvedValueOnce({ type: "none" });
      chain.getTransactionInfo.mockRejectedValue(new ChainReadUnsupportedError("unsupported"));

      const withoutList = await enrichStakingResources(
        seiEvm,
        address,
        [redelegate({ hash: "0xunsupported" })],
        base,
        chain,
      );
      expect(withoutList.redelegations).toEqual([]);

      chain.getAccountInfo.mockRejectedValueOnce(new ChainReadUnsupportedError("unsupported"));
      const unread = await enrichStakingResources(seiEvm, address, [], base, chain);
      expect(unread.redelegations).toEqual([]);
    });

    it("decodes nothing for a chain without a redelegate function", async () => {
      const chain = chainReads();
      chain.getAccountInfo.mockResolvedValue({ type: "none" });

      const result = await enrichStakingResources(
        ethereum,
        address,
        [redelegate({ hash: "0xredelegate" })],
        base,
        chain,
      );

      expect(result.redelegations).toEqual([]);
      expect(chain.getTransactionInfo).not.toHaveBeenCalled();
    });

    it("uses the default unbonding period of a chain that declares none", async () => {
      const chain = chainReads();
      chain.getAccountInfo.mockResolvedValue({ type: "none" });
      chain.getTransactionInfo.mockResolvedValue(undefined);
      const { unbondingPeriodDays } = staking;
      delete (staking as { unbondingPeriodDays?: number }).unbondingPeriodDays;
      try {
        await enrichStakingResources(
          seiEvm,
          address,
          [redelegate({ hash: "0xrecent", date: new Date(Date.now() - 20 * 24 * 3600 * 1000) })],
          base,
          chain,
        );
      } finally {
        (staking as { unbondingPeriodDays?: number }).unbondingPeriodDays = unbondingPeriodDays;
      }
      expect(chain.getTransactionInfo).toHaveBeenCalledWith("0xrecent");
    });
  });

  describe("refreshOperations", () => {
    it("refreshes the operations the chain finds mined, with their sub-operations", async () => {
      const chain = chainReads();
      const time = new Date("2026-02-01T00:00:00.000Z");
      chain.getTransactionInfo.mockResolvedValue({
        hash: "0xpending",
        block: { height: 12, hash: "0xblock", time },
        fee: 21n,
        value: 100n,
        sequence: 7n,
      });

      const [refreshed] = await refreshOperations(
        [pending({ subOperations: [pending({ type: "IN" })] })],
        chain,
      );

      expect(refreshed).toMatchObject({
        blockHeight: 12,
        blockHash: "0xblock",
        date: time,
        fee: new BigNumber(21),
        value: new BigNumber(121),
        transactionSequenceNumber: new BigNumber(7),
        subOperations: [
          expect.objectContaining({
            blockHeight: 12,
            blockHash: "0xblock",
            date: time,
            transactionSequenceNumber: new BigNumber(7),
          }),
        ],
      });
    });

    it("keeps the operation's sequence and counts nothing the chain does not report", async () => {
      const chain = chainReads();
      const time = new Date("2026-02-01T00:00:00.000Z");
      chain.getTransactionInfo.mockResolvedValue({
        hash: "0xpending",
        block: { height: 12, hash: "0xblock", time },
      });

      const [refreshed] = await refreshOperations([pending()], chain);

      expect(refreshed).toMatchObject({
        fee: new BigNumber(0),
        value: new BigNumber(0),
        transactionSequenceNumber: new BigNumber(4),
      });
      expect(refreshed.subOperations).toBeUndefined();
    });

    it("leaves out the operations still pending, unknown or unreadable", async () => {
      const chain = chainReads();
      chain.getTransactionInfo
        .mockResolvedValueOnce({ hash: "0xa", block: null })
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new ChainReadUnsupportedError("unsupported"));

      await expect(
        refreshOperations(
          [pending({ hash: "0xa" }), pending({ hash: "0xb" }), pending({ hash: "0xc" })],
          chain,
        ),
      ).resolves.toEqual([]);
    });
  });
});
