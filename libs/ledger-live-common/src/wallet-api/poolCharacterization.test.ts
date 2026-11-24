import BigNumber from "bignumber.js";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { buildEstimateMaxSpendable } from "@ledgerhq/coin-zcash/bridge/estimateMaxSpendable";
import { buildLegacyEstimateMaxSpendable } from "@ledgerhq/coin-zcash/legacy/estimateMaxSpendable";
import { resolveWalletAccount } from "@ledgerhq/coin-zcash/legacy/buildTransaction";
import { zcashSafeFeePerByte } from "@ledgerhq/coin-zcash/legacy/fees";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import { DerivationModes } from "@ledgerhq/wallet-btc/types";
import { UnsupportedMaxSpendableFilter } from "@ledgerhq/ledger-wallet-framework/errors";
import type { ZcashContext } from "@ledgerhq/coin-zcash/config";
import type { BitcoinOutput, ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";
import { ZCASH_MAX_TRANSPARENT_INPUTS } from "@ledgerhq/coin-zcash/constants";
import { makeZcashAccountBalances } from "@ledgerhq/coin-zcash/bridge/accountBalances";
import { estimateMaxSpendable as aleoEstimateMaxSpendable } from "@ledgerhq/coin-aleo/bridge/estimateMaxSpendable";
import aleoCoinConfig from "@ledgerhq/coin-aleo/config";
import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/constants";
import type { AleoAccount, AleoCoinConfig, AleoTokenAccount } from "@ledgerhq/coin-aleo/types";
import { aleoAccountBalances } from "@ledgerhq/coin-aleo/bridge/accountBalances";
import {
  selectMaxSpendableRows,
  spendableOfRows,
  withAccountBalances,
} from "@ledgerhq/ledger-wallet-framework/account/balances";
import "../__tests__/test-helpers/setup";
import { getAccountBridge } from "../bridge";
import { defaultBridgeExtensions } from "../bridge/defaultBridgeExtensions";
import { isZcashShieldedEnabled, setZcashShieldedEnabled } from "../bridge/zcashRouting";
import { genericEstimateMaxSpendable } from "../bridge/generic-coin-framework/estimateMaxSpendable";
import { getCoinModuleApi } from "../bridge/generic-coin-framework/api";
import { makeAleoAccount } from "../families/aleo/__mocks__/account.mock";
import { resolveWalletApiMaxSpendable, resolveWalletApiSpendableBalance } from "./converters";

jest.mock("../bridge", () => ({
  getAccountBridge: jest.fn(),
}));

const mockEstimateAccountMaxSpendable = jest.fn();

jest.mock("@ledgerhq/coin-zcash/legacy/buildTransaction", () => ({
  resolveWalletAccount: jest.fn(),
}));

jest.mock("@ledgerhq/wallet-btc/index", () => ({
  __esModule: true,
  default: {
    estimateAccountMaxSpendable: (...args: unknown[]) => mockEstimateAccountMaxSpendable(...args),
  },
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

const PUBLIC = { private: false } as const;

const exposedToSwap = async (account: AccountLike, parentAccount?: Account | null) => ({
  spendableBalance: await resolveWalletApiSpendableBalance(account, parentAccount),
  publicBalance: spendableOfRows(selectMaxSpendableRows(account, PUBLIC)),
  maxSpendable: await resolveWalletApiMaxSpendable(account, parentAccount, PUBLIC),
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

    const shieldedEstimate = buildEstimateMaxSpendable(context);
    const transparentOnlyEstimate = buildLegacyEstimateMaxSpendable(context);
    const bridge = {
      estimateMaxSpendable: (args: Parameters<typeof shieldedEstimate>[0]) =>
        isZcashShieldedEnabled() ? shieldedEstimate(args) : transparentOnlyEstimate(args),
      getWalletApiSpendableBalance: defaultBridgeExtensions.getWalletApiSpendableBalance,
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
      { shielded = 0, ...overrides }: { shielded?: number } & Partial<Record<string, unknown>> = {},
    ): ZcashAccount => {
      const balance = new BigNumber(values.reduce((sum, value) => sum + value, shielded));
      return {
        type: "Account",
        id: "js:2:zcash:xpub6D:",
        // A live app addresses Zcash as a bitcoin-family currency; the account stays a zcash one.
        currency: { id: "zcash", family: "zcash", name: "Zcash" },
        blockHeight: 0,
        balance,
        spendableBalance: balance,
        pendingOperations: [],
        bitcoinResources: { utxos: values.map((value, index) => utxo(value, index)) },
        ...overrides,
      } as unknown as ZcashAccount;
    };

    const MARGINAL_FEE = 5_000;
    const SHIELDING_ACTIONS_FOR_ONE_INPUT = 3;

    const ascending = (count: number) => Array.from({ length: count }, (_, i) => (i + 1) * 1_000);

    beforeEach(() => {
      mockGetAccountBridge.mockReset();
      mockGetAccountBridge.mockResolvedValue(bridge);
    });

    const withRows = (account: ZcashAccount): ZcashAccount =>
      withAccountBalances(account, makeZcashAccountBalances(isZcashShieldedEnabled)(account));

    describe("with the shielded engine", () => {
      beforeEach(() => {
        setZcashShieldedEnabled(true);
      });

      it("exposes no spendable balance, public funds or max for an account with no UTXO", async () => {
        expect(await exposedToSwap(withRows(makeAccount([])))).toEqual({
          spendableBalance: new BigNumber(0),
          publicBalance: new BigNumber(0),
          maxSpendable: new BigNumber(0),
        });
      });

      it("exposes the transparent UTXO as public funds and its max net of a shielding fee", async () => {
        expect(await exposedToSwap(withRows(makeAccount([100_000])))).toEqual({
          spendableBalance: new BigNumber(100_000),
          publicBalance: new BigNumber(100_000),
          maxSpendable: new BigNumber(100_000 - SHIELDING_ACTIONS_FOR_ONE_INPUT * MARGINAL_FEE),
        });
      });

      it("exposes the whole UTXO set as public funds but a max over the 32 largest, net of one action per input plus two", async () => {
        const allUtxos = 820_000;
        const largest32Utxos = 784_000;

        expect(await exposedToSwap(withRows(makeAccount(ascending(40))))).toEqual({
          spendableBalance: new BigNumber(allUtxos),
          publicBalance: new BigNumber(allUtxos),
          maxSpendable: new BigNumber(
            largest32Utxos - (ZCASH_MAX_TRANSPARENT_INPUTS + 2) * MARGINAL_FEE,
          ),
        });
      });

      it("exposes the shielded funds as spendable but no public funds or max for a shielded-only account", async () => {
        const account = withRows(
          makeAccount([], {
            shielded: 5_000_000,
            privateInfo: {
              lastProcessedBlock: 3_450_000,
              transactions: [],
              ufvk: "uview1",
            },
          }),
        );

        expect(account.balances?.map(({ pool, value }) => [pool, value.toNumber()])).toEqual([
          ["transparent", 0],
          ["ironwood", 5_000_000],
        ]);
        expect(await exposedToSwap(account)).toEqual({
          spendableBalance: new BigNumber(5_000_000),
          publicBalance: new BigNumber(0),
          maxSpendable: new BigNumber(0),
        });
      });

      it("answers for an account whose shielded sync was never activated", async () => {
        const account = withRows(makeAccount([100_000], { privateInfo: undefined }));

        expect(await exposedToSwap(account)).toEqual({
          spendableBalance: new BigNumber(100_000),
          publicBalance: new BigNumber(100_000),
          maxSpendable: new BigNumber(85_000),
        });
      });

      it("prices a zcash_testnet account at the lower marginal fee", async () => {
        const account = makeAccount([100_000], {
          currency: { id: "zcash_testnet", family: "zcash", name: "Zcash Testnet" },
        });

        expect(await exposedToSwap(withRows(account))).toEqual({
          spendableBalance: new BigNumber(100_000),
          publicBalance: new BigNumber(100_000),
          maxSpendable: new BigNumber(97_000),
        });
      });
    });

    describe("transparent-only, without the shielded engine", () => {
      const pendingInput = { hash: "aa".repeat(32), outputIndex: 1 };
      const zcashCrypto = cryptoFactory("zcash");
      const safeFeePerByte = zcashSafeFeePerByte(
        zcashCrypto,
        DerivationModes.LEGACY,
        MARGINAL_FEE,
      ).toNumber();

      beforeEach(() => {
        jest.mocked(resolveWalletAccount).mockResolvedValue({
          xpub: { crypto: zcashCrypto, derivationMode: DerivationModes.LEGACY },
        } as never);
        mockEstimateAccountMaxSpendable.mockReset();
        mockEstimateAccountMaxSpendable.mockResolvedValue(new BigNumber(90_000));
      });

      it("exposes the unspent UTXOs as public funds and wallet-btc's max at the safe ZIP-317 rate, without the pending inputs", async () => {
        const account = withRows(
          makeAccount([100_000, 50_000], {
            pendingOperations: [
              {
                type: "OUT",
                extra: { inputs: [`${pendingInput.hash}-${pendingInput.outputIndex}`] },
              },
            ],
          }),
        );

        expect(await exposedToSwap(account)).toEqual({
          spendableBalance: new BigNumber(150_000),
          publicBalance: new BigNumber(100_000),
          maxSpendable: new BigNumber(90_000),
        });
        expect(mockEstimateAccountMaxSpendable).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          safeFeePerByte,
          [pendingInput],
          [],
        );
      });

      it("refuses a max funded from a pool other than the transparent one", async () => {
        const account = withRows(makeAccount([100_000]));

        await expect(
          resolveWalletApiMaxSpendable(account, undefined, { pools: ["ironwood"] }),
        ).rejects.toBeInstanceOf(UnsupportedMaxSpendableFilter);
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
      getWalletApiSpendableBalance: defaultBridgeExtensions.getWalletApiSpendableBalance,
    } as unknown as Bridge;

    const makeMainAccount = (overrides: Partial<AleoAccount> = {}): AleoAccount => ({
      ...makeAleoAccount(),
      subAccounts: [],
      pendingOperations: [],
      ...overrides,
    });

    const withTransparentBalance = (value: number): AleoAccount => {
      const account = makeMainAccount();
      return {
        ...account,
        balance: new BigNumber(value),
        spendableBalance: new BigNumber(value),
        aleoResources: { ...account.aleoResources!, transparentBalance: new BigNumber(value) },
      };
    };

    const makeTokenAccount = (
      parent: AleoAccount,
      parts: { transparent: number; private: number },
    ): AleoTokenAccount => {
      const balance = new BigNumber(parts.transparent + parts.private);
      return {
        type: "TokenAccount",
        id: `${parent.id}+token`,
        parentId: parent.id,
        token: { ...mockTokenCurrency(), parentCurrencyId: "aleo" },
        balance,
        spendableBalance: balance,
        pendingOperations: [],
        operations: [],
        unspentPrivateRecords: null,
        transparentBalance: new BigNumber(parts.transparent),
        privateBalance: new BigNumber(parts.private),
      } as unknown as AleoTokenAccount;
    };

    beforeEach(() => {
      aleoCoinConfig.setCoinConfig(() => config);
      mockGetAccountBridge.mockReset();
      mockGetAccountBridge.mockResolvedValue(bridge);
    });

    const withRows = (account: AleoAccount): AleoAccount =>
      withAccountBalances(account, aleoAccountBalances(account));

    it("exposes the whole spendable balance, the public row and a max net of the public transfer fee", async () => {
      const account = withRows(withTransparentBalance(1_000_000));

      expect(await exposedToSwap(account)).toEqual({
        spendableBalance: account.spendableBalance,
        publicBalance: new BigNumber(1_000_000),
        maxSpendable: new BigNumber(1_000_000 - FEE),
      });
    });

    it("exposes the token's whole public row as its public max, the fee being paid in native credits", async () => {
      const parent = withTransparentBalance(1_000_000);
      const account = withRows({
        ...parent,
        subAccounts: [makeTokenAccount(parent, { transparent: 500_000, private: 200_000 })],
      });
      const token = account.subAccounts![0];

      expect(await exposedToSwap(token, account)).toEqual({
        spendableBalance: new BigNumber(700_000),
        publicBalance: new BigNumber(500_000),
        maxSpendable: new BigNumber(500_000),
      });
    });

    it("exposes no public funds or max for a token account that only holds private funds", async () => {
      const parent = withTransparentBalance(0);
      const account = withRows({
        ...parent,
        subAccounts: [makeTokenAccount(parent, { transparent: 0, private: 700_000 })],
      });
      const token = account.subAccounts![0];

      expect(await exposedToSwap(token, account)).toEqual({
        spendableBalance: new BigNumber(700_000),
        publicBalance: new BigNumber(0),
        maxSpendable: new BigNumber(0),
      });
    });

    it("exposes an aggregate public row and omits the ambiguous zero max for an account that has no aleo resources", async () => {
      const account = withRows(makeMainAccount({ aleoResources: undefined }));

      expect(account.balances).toEqual([{ value: account.balance }]);
      expect(await exposedToSwap(account)).toEqual({
        spendableBalance: account.spendableBalance,
        publicBalance: account.spendableBalance,
        maxSpendable: undefined,
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
