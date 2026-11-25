/**
 * Pins what a live app is shown today for an account's spendable balance and its max
 * spendable, through the real family estimators and bridge extensions of the families that
 * hold funds in several pools. Only the bridge lookup, the network and the config are stubbed.
 */
import BigNumber from "bignumber.js";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { buildEstimateMaxSpendable } from "@ledgerhq/coin-zcash/bridge/estimateMaxSpendable";
import type { ZcashContext } from "@ledgerhq/coin-zcash/config";
import type { BitcoinOutput, ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";
import { ZCASH_MAX_TRANSPARENT_INPUTS } from "@ledgerhq/coin-zcash/constants";
import { estimateMaxSpendable as aleoEstimateMaxSpendable } from "@ledgerhq/coin-aleo/bridge/estimateMaxSpendable";
import aleoCoinConfig from "@ledgerhq/coin-aleo/config";
import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/constants";
import type { AleoAccount, AleoCoinConfig, AleoTokenAccount } from "@ledgerhq/coin-aleo/types";
import "../__tests__/test-helpers/setup";
import { getAccountBridge } from "../bridge";
import { defaultBridgeExtensions } from "../bridge/defaultBridgeExtensions";
import { setZcashShieldedEnabled } from "../bridge/zcashRouting";
import { genericEstimateMaxSpendable } from "../bridge/generic-coin-framework/estimateMaxSpendable";
import { getCoinModuleApi } from "../bridge/generic-coin-framework/api";
import zcashExtensions from "../families/zcash/bridgeExtensions";
import aleoExtensions from "../families/aleo/bridgeExtensions";
import { makeAleoAccount } from "../families/aleo/__mocks__/account.mock";
import { resolveWalletApiMaxSpendable, resolveWalletApiSpendableBalance } from "./converters";

jest.mock("../bridge", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("../coin-modules/registry", () => ({
  isCoinModuleRegistered: () => true,
  loadWalletApiAdapterForFamily: () => undefined,
}));

jest.mock("../bridge/generic-coin-framework/api", () => ({
  getCoinModuleApi: jest.fn(),
}));

jest.mock("../bridge/generic-coin-framework/createTransaction", () => ({
  createTransaction: jest.fn().mockReturnValue({}),
}));

jest.mock("../bridge/generic-coin-framework/bridge", () => ({
  getBridgeApi: jest.fn().mockResolvedValue({}),
}));

const mockGetAccountBridge = jest.mocked(getAccountBridge);
type Bridge = Awaited<ReturnType<typeof getAccountBridge>>;
const mockGetCoinModuleApi = jest.mocked(getCoinModuleApi);

const exposedTo = async (account: AccountLike, parentAccount?: Account | null) => ({
  spendableBalance: await resolveWalletApiSpendableBalance(account, parentAccount),
  maxSpendable: await resolveWalletApiMaxSpendable(account, parentAccount),
});

describe("pool-holding families, as exposed to live apps", () => {
  afterEach(() => {
    setZcashShieldedEnabled(false);
  });

  describe("zcash", () => {
    // Same value as the coin module's own max spendable tests: no `zip2009` entry.
    const context: ZcashContext = {
      config: async () => ({
        status: { type: "active" },
        name: "Zcash",
        unit: { name: "zcash", code: "ZEC", magnitude: 8 },
        zaino: { url: "https://zaino.test.invalid" },
        explorer: { url: "https://explorer.test.invalid" },
      }),
      logger: () => {},
    };

    const bridge = {
      estimateMaxSpendable: buildEstimateMaxSpendable(context),
      getWalletApiSpendableBalance: zcashExtensions.getWalletApiSpendableBalance,
    } as unknown as Bridge;

    const utxo = (value: number, outputIndex: number): BitcoinOutput => ({
      hash: "aa".repeat(32),
      outputIndex,
      blockHeight: 3_425_800,
      address: "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8",
      value: new BigNumber(value),
      rbf: false,
      isChange: false,
    });

    const makeAccount = (
      values: number[],
      overrides: Partial<Record<string, unknown>> = {},
    ): ZcashAccount =>
      ({
        type: "Account",
        id: "js:2:zcash:xpub6D:",
        // A live app addresses Zcash as a bitcoin-family currency; the account stays a zcash one.
        currency: { id: "zcash", family: "zcash", name: "Zcash" },
        blockHeight: 0,
        balance: new BigNumber(5_000_000),
        spendableBalance: new BigNumber(5_000_000),
        pendingOperations: [],
        bitcoinResources: { utxos: values.map((value, index) => utxo(value, index)) },
        ...overrides,
      }) as unknown as ZcashAccount;

    const ascending = (count: number) => Array.from({ length: count }, (_, i) => (i + 1) * 1_000);

    beforeEach(() => {
      mockGetAccountBridge.mockReset();
      mockGetAccountBridge.mockResolvedValue(bridge);
    });

    it("exposes a zero spendable balance and a zero max for an account with no UTXO", async () => {
      expect(await exposedTo(makeAccount([]))).toEqual({
        spendableBalance: new BigNumber(0),
        maxSpendable: new BigNumber(0),
      });
    });

    it.each([false, true])(
      "exposes the transparent UTXO and its max net of one fee, shielded engine %s",
      async enabled => {
        setZcashShieldedEnabled(enabled);

        // Two logical actions at the 5,000 zatoshi marginal fee.
        expect(await exposedTo(makeAccount([100_000]))).toEqual({
          spendableBalance: new BigNumber(100_000),
          maxSpendable: new BigNumber(90_000),
        });
      },
    );

    it("exposes the whole UTXO set as spendable with the shielded engine off, but a max over the 32 largest", async () => {
      setZcashShieldedEnabled(false);

      // 40 UTXOs of 1,000..40,000: all of them add up to 820,000, the 32 largest to 784,000.
      expect(await exposedTo(makeAccount(ascending(40)))).toEqual({
        spendableBalance: new BigNumber(820_000),
        maxSpendable: new BigNumber(784_000 - ZCASH_MAX_TRANSPARENT_INPUTS * 5_000),
      });
    });

    it("exposes the 32 largest UTXOs as spendable and as max with the shielded engine on", async () => {
      setZcashShieldedEnabled(true);

      expect(await exposedTo(makeAccount(ascending(40)))).toEqual({
        spendableBalance: new BigNumber(784_000),
        maxSpendable: new BigNumber(784_000 - ZCASH_MAX_TRANSPARENT_INPUTS * 5_000),
      });
    });

    it.each([false, true])(
      "exposes zero for an account that only holds shielded funds, shielded engine %s",
      async enabled => {
        setZcashShieldedEnabled(enabled);

        // `spendableBalance` is the transparent plus private total; none of it reaches a live app.
        const account = makeAccount([], {
          privateInfo: {
            lastProcessedBlock: 3_450_000,
            transactions: [],
            ufvk: "uview1",
          },
        });

        expect(await exposedTo(account)).toEqual({
          spendableBalance: new BigNumber(0),
          maxSpendable: new BigNumber(0),
        });
      },
    );

    it("answers for an account whose shielded sync was never activated", async () => {
      expect(await exposedTo(makeAccount([100_000], { privateInfo: undefined }))).toEqual({
        spendableBalance: new BigNumber(100_000),
        maxSpendable: new BigNumber(90_000),
      });
    });

    it("prices a zcash_testnet account at the lower marginal fee", async () => {
      const account = makeAccount([100_000], {
        currency: { id: "zcash_testnet", family: "zcash", name: "Zcash Testnet" },
      });

      expect(await exposedTo(account)).toEqual({
        spendableBalance: new BigNumber(100_000),
        maxSpendable: new BigNumber(98_000),
      });
    });
  });

  describe("aleo", () => {
    const FEE = 34_060;
    const config: AleoCoinConfig = {
      status: { type: "active" },
      networkType: "mainnet",
      name: "Aleo",
      unit: { name: "Aleo", code: "ALEO", magnitude: 6 },
      defaultValidator: "aleo1validator000000000000000000000000000000000000000000000000q",
      apiUrls: { node: "https://node.test.invalid", sdk: "https://sdk.test.invalid" },
      feeByTransactionType: {
        [TRANSACTION_TYPE.TRANSFER_PUBLIC]: FEE,
        [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 2_308,
        [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 17_972,
        [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 18_494,
        [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC]: FEE,
        [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE]: 2_308,
        [TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC]: 18_494,
        [TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE]: 17_972,
        [TRANSACTION_TYPE.BOND_PUBLIC]: 5_621,
        [TRANSACTION_TYPE.UNBOND_PUBLIC]: 10_813,
        [TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC]: 3_066,
      },
      feeSafetyMultiplier: 1,
      isFeeSponsored: false,
      enableTokens: true,
      enableStaking: false,
      useEncryptedProve: false,
      recordPickingStrategy: "auto",
      liveBlockHeightPollMs: 10_000,
      maxUnbondingSyncAttempts: 3,
    };

    const bridge = {
      estimateMaxSpendable: aleoEstimateMaxSpendable,
      getWalletApiSpendableBalance: aleoExtensions.getWalletApiSpendableBalance,
    } as unknown as Bridge;

    const makeMainAccount = (overrides: Partial<AleoAccount> = {}): AleoAccount => ({
      ...makeAleoAccount(),
      ...overrides,
    });

    const withTransparentBalance = (value: number): AleoAccount => {
      const account = makeMainAccount();
      return {
        ...account,
        aleoResources: { ...account.aleoResources!, transparentBalance: new BigNumber(value) },
      };
    };

    const makeTokenAccount = (parent: AleoAccount, transparentBalance?: number): AleoTokenAccount =>
      ({
        type: "TokenAccount",
        id: `${parent.id}+token`,
        parentId: parent.id,
        token: { ...mockTokenCurrency(), parentCurrencyId: "aleo" },
        balance: new BigNumber(700_000),
        spendableBalance: new BigNumber(700_000),
        pendingOperations: [],
        operations: [],
        privateBalance: null,
        unspentPrivateRecords: null,
        ...(transparentBalance !== undefined && {
          transparentBalance: new BigNumber(transparentBalance),
        }),
      }) as unknown as AleoTokenAccount;

    beforeEach(() => {
      aleoCoinConfig.setCoinConfig(() => config);
      mockGetAccountBridge.mockReset();
      mockGetAccountBridge.mockResolvedValue(bridge);
    });

    it("exposes the transparent balance and its max net of the public transfer fee", async () => {
      expect(await exposedTo(withTransparentBalance(1_000_000))).toEqual({
        spendableBalance: new BigNumber(1_000_000),
        maxSpendable: new BigNumber(1_000_000 - FEE),
      });
    });

    it("exposes zero for an account that has no aleo resources", async () => {
      const account = makeMainAccount({ aleoResources: undefined });

      expect(await exposedTo(account)).toEqual({
        spendableBalance: new BigNumber(0),
        maxSpendable: new BigNumber(0),
      });
    });

    it("exposes a token's transparent balance as its max", async () => {
      const parent = withTransparentBalance(1_000_000);
      const token = makeTokenAccount({ ...parent }, 500_000);
      const account = { ...parent, subAccounts: [token] };

      expect(await exposedTo(token, account)).toEqual({
        spendableBalance: new BigNumber(500_000),
        maxSpendable: new BigNumber(500_000),
      });
    });

    it("exposes zero spendable for a token account with no transparent balance", async () => {
      const parent = withTransparentBalance(0);
      const token = makeTokenAccount({ ...parent });
      const account = { ...parent, subAccounts: [token] };

      expect(await exposedTo(token, account)).toEqual({
        spendableBalance: new BigNumber(0),
        maxSpendable: new BigNumber(0),
      });
    });
  });

  describe("a family with a single pool", () => {
    const currency = getCryptoCurrencyById("ethereum");
    const bridge = (): Bridge =>
      ({
        estimateMaxSpendable: genericEstimateMaxSpendable("testnet", "local"),
        getWalletApiSpendableBalance: defaultBridgeExtensions.getWalletApiSpendableBalance,
      }) as unknown as Bridge;

    const makeAccount = (): Account =>
      ({
        id: "account_id",
        type: "Account",
        currency,
        spendableBalance: new BigNumber(50_000_000),
        balance: new BigNumber(60_000_000),
        freshAddress: "account_address",
        pendingOperations: [],
      }) as unknown as Account;

    beforeEach(() => {
      mockGetAccountBridge.mockReset();
      mockGetAccountBridge.mockResolvedValue(bridge());
      mockGetCoinModuleApi.mockReset();
      mockGetCoinModuleApi.mockResolvedValue({
        craftTransactionData: () => ({ type: "none" }),
        estimateFees: jest.fn().mockResolvedValue({ value: 10_000n }),
      } as never);
    });

    it("exposes the spendable balance and a max net of the estimated fee", async () => {
      expect(await exposedTo(makeAccount())).toEqual({
        spendableBalance: new BigNumber(50_000_000),
        maxSpendable: new BigNumber(49_990_000),
      });
    });

    it("exposes a token account's spendable balance net of its pending spend", async () => {
      const token = {
        type: "TokenAccount",
        id: "token_id",
        parentId: "account_id",
        spendableBalance: new BigNumber(123),
        pendingOperations: [{ type: "OUT", value: new BigNumber(23) }],
      } as unknown as TokenAccount;

      expect(await exposedTo(token, makeAccount())).toEqual({
        spendableBalance: new BigNumber(123),
        maxSpendable: new BigNumber(100),
      });
    });
  });
});
