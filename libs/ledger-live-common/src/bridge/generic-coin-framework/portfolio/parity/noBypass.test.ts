import http from "node:http";
import https from "node:https";
import { createElement } from "react";
import TestRenderer, { act } from "react-test-renderer";
import axios from "axios";
import BigNumber from "bignumber.js";
import { FetchRequest, Interface } from "ethers";
import { lastValueFrom, toArray } from "rxjs";
import { createSingleAddressAccountModule } from "@ledgerhq/account-module-single-address";
import { CHAIN_ID, type EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { createPortfolioServiceClient } from "@ledgerhq/portfolio-module-portfolio-service";
import type { Account, AccountBridge, SignOperationEvent } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { loadBridgeExtensionsForFamily } from "../../../../coin-modules/registry";
import { bitcoinAccountModule } from "../../../../families/bitcoin/accountModule/module";
import { networkGasOptions } from "../../../../families/evm/editTransaction/gasOptions";
import { getEvmTokenAllowance } from "../../../../families/evm/getTokenAllowance";
import { getEvmTransactionByHash } from "../../../../families/evm/getTransactionByHash";
import {
  isSeiAccountUnassociated,
  prefetchValidators,
} from "../../../../families/evm/staking/logic";
import {
  useEvmStakingValidators,
  type EvmStakingValidatorsState,
} from "../../../../families/evm/staking/react";
import { useLedgerFirstShuffledValidatorsNear } from "../../../../families/near/react";
import { A4_SUPPORTED_NETWORKS } from "../../a4/config";
import { getCoinFrameworkAccountBridge } from "../../accountBridge";
import { buildContext } from "../../api/context";
import { buildGenericTransactionIntent } from "../../buildIntent";
import { getCoinFrameworkCurrencyBridge } from "../../currencyBridge";
import { createTransaction } from "../../createTransaction";
import { getSponsoredCoinApi } from "../../sponsored";
import type { CoinFrameworkSigner, GenericTransaction } from "../../types";
import { serviceStandIn, standInNetwork } from "../../tests/portfolioFixtures";
import { networkOf } from "../config";
import {
  fakeCoinModule,
  fakeUtxoCoinModule,
  utxoAddress,
  type FakeChain,
  type FakeUtxoChain,
} from "./fakeCoinModule";
import {
  blockAt,
  coinOperation,
  configure,
  emptyAccount,
  serveModule,
  signedEvmTransaction,
  token,
  useTokens,
  type Path,
} from "./harness";
import { guardCall, takeBypasses } from "./scope";

jest.mock("../../api", () => ({ getCoinModuleApi: jest.fn() }));
// Every method of the local side runs inside a portfolio method scope.
jest.mock("@ledgerhq/portfolio-module-local", () => {
  const actual = jest.requireActual("@ledgerhq/portfolio-module-local");
  const { scoped } = jest.requireActual("./scope");
  return {
    ...actual,
    createLocalPortfolio: (...args: unknown[]) => scoped(actual.createLocalPortfolio(...args)),
  };
});
jest.mock("@ledgerhq/portfolio-module-portfolio-service", () => ({
  createPortfolioServiceClient: jest.fn(),
}));
jest.mock("@ledgerhq/live-network", () => {
  const actual = jest.requireActual("@ledgerhq/live-network");
  const { guardCall: guard } = jest.requireActual("./scope");
  return {
    ...actual,
    __esModule: true,
    default: () => {
      guard("@ledgerhq/live-network");
      throw new Error("no network in tests");
    },
  };
});
jest.mock("@ledgerhq/live-network/network", () => {
  const actual = jest.requireActual("@ledgerhq/live-network/network");
  const { guardCall: guard } = jest.requireActual("./scope");
  return {
    ...actual,
    __esModule: true,
    default: () => {
      guard("@ledgerhq/live-network/network");
      throw new Error("no network in tests");
    },
  };
});
jest.mock("../../a4/client/index", () => {
  const { guardCall: guard } = jest.requireActual("./scope");
  return {
    A4Client: jest.fn(() => {
      guard("A4Client");
      throw new Error("no A4 in tests");
    }),
  };
});

const OTHER = "someone-else";
const native = { type: "native" } as const;
const SERVICE_URL = "https://portfolio.test";
/** A4 on for every network, as production can set it: neither path may reach it with the portfolio. */
const A4_ON = {
  environment: "prd",
  chains: Object.fromEntries(
    A4_SUPPORTED_NETWORKS.map(network => [network, { enabled: true, registerOnly: true }]),
  ),
};

/** A transport of the network: recorded when called around the portfolio layer, never served. */
const blockedTransport = (name: string) => () => {
  guardCall(name);
  throw new Error(`no ${name} in tests`);
};

const originalAdapter = axios.defaults.adapter;
const originalFetch = global.fetch;

beforeAll(() => {
  axios.defaults.adapter = blockedTransport("axios");
  global.fetch = blockedTransport("fetch") as never;
  FetchRequest.registerGetUrl(blockedTransport("ethers FetchRequest") as never);
  for (const transport of [http, https]) {
    jest.spyOn(transport, "request").mockImplementation(blockedTransport("node http") as never);
    jest.spyOn(transport, "get").mockImplementation(blockedTransport("node http") as never);
  }
});

afterAll(() => {
  axios.defaults.adapter = originalAdapter;
  global.fetch = originalFetch;
  FetchRequest.registerGetUrl(FetchRequest.createGetUrlFunc());
  jest.restoreAllMocks();
});

afterEach(() => {
  jest.mocked(createPortfolioServiceClient).mockReset();
});

/** The device of an account: its fresh address (`device.address`), and its key controlling it. */
const signerFor = (device: { address: string }, publicKey: string): CoinFrameworkSigner => ({
  getAddress: (async (_deviceId: string, { path }: { path: string }) => ({
    address: device.address,
    publicKey,
    path,
  })) as never,
  context: (async (
    _deviceId: string,
    fn: (signer: {
      getAddress: () => Promise<{ address: string; publicKey: string }>;
      signTransaction: (path: string, unsigned: string) => Promise<string>;
    }) => Promise<unknown>,
  ) =>
    fn({
      getAddress: async () => ({ address: device.address, publicKey }),
      signTransaction: async (_path, unsigned) => `signature(${unsigned})`,
    })) as never,
});

type Scenario = {
  currency: CryptoCurrency;
  address: string;
  derivationMode?: string;
  xpub?: string;
  seedIdentifier?: string;
  /** The coin module of the client (guarded) and of the service stand-in, on the same chain. */
  module: (guard?: (method: string) => void) => object;
  transaction: (account: Account) => GenericTransaction;
  coinConfig?: object;
  /** The family signs raw transactions on the device only (cosmos, bitcoin): not run here. */
  deviceRawSigning?: boolean;
  scan?: boolean;
  /** The family's own entry points beyond the bridge. */
  extras?: (account: Account) => Promise<unknown>;
};

const singleAddress = (chain: FakeChain) => (guard?: (method: string) => void) =>
  fakeCoinModule(chain, guard);

const chainOf = (me: string, balances: Balance[], fields: Partial<FakeChain> = {}): FakeChain => ({
  tip: blockAt(20),
  balances,
  operations: [coinOperation({ height: 19, value: 1_000n, senders: [OTHER], recipients: [me] })],
  validators: [{ id: "validator", address: "validator", name: "Validator" }],
  ...fields,
});

const send = (account: Account, fields: Partial<GenericTransaction> = {}): GenericTransaction => ({
  ...createTransaction(account),
  amount: new BigNumber(10),
  recipient: OTHER,
  ...fields,
});

const USDT = token({
  id: "tron/trc20/tusdt",
  parentCurrencyId: "tron",
  contractAddress: "TUsdtContract",
  tokenType: "trc20",
});
const USDC = token({
  id: "ethereum/erc20/usd__coin",
  parentCurrencyId: "ethereum",
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  tokenType: "erc20",
});

const EVM_ME = "0x1111111111111111111111111111111111111111";
const evmChainOf = (fields: Partial<FakeChain> = {}): FakeChain =>
  chainOf(
    EVM_ME,
    [
      { value: 10n ** 18n, asset: native },
      {
        value: 5n,
        asset: { type: "erc20", assetReference: USDC.contractAddress, assetOwner: EVM_ME },
      },
    ],
    {
      estimate: () => ({
        value: 630_000n,
        parameters: {
          gasOptions: {
            slow: {
              maxFeePerGas: 10n,
              maxPriorityFeePerGas: 1n,
              gasPrice: null,
              nextBaseFee: 9n,
            },
            medium: {
              maxFeePerGas: 20n,
              maxPriorityFeePerGas: 2n,
              gasPrice: null,
              nextBaseFee: 9n,
            },
            fast: {
              maxFeePerGas: 30n,
              maxPriorityFeePerGas: 3n,
              gasPrice: null,
              nextBaseFee: 9n,
            },
          },
        },
      }),
      call: () => `0x${"0".repeat(63)}7`,
      combine: signedEvmTransaction,
      ...fields,
    },
  );
const evmChain = (guard?: (method: string) => void) => fakeCoinModule(evmChainOf(), guard);

/** Sei's address precompile, answering no Cosmos address: the account is not associated yet. */
const seiAddressPrecompile = new Interface([
  "function getSeiAddr(address addr) external view returns (string memory response)",
]);
const seiChain = (guard?: (method: string) => void) =>
  fakeCoinModule(
    evmChainOf({
      operations: [
        coinOperation({ height: 19, value: 1_000n, senders: [OTHER], recipients: [EVM_ME] }),
        // A redelegation still unbonding whose calldata the account holds none of.
        coinOperation({
          height: 18,
          hash: "redelegate",
          type: "REDELEGATE",
          fees: 10n,
          senders: [EVM_ME],
          recipients: ["0x0000000000000000000000000000000000001005"],
          date: new Date(),
        }),
      ],
      call: () => seiAddressPrecompile.encodeFunctionResult("getSeiAddr", [""]),
    }),
    guard,
  );

const utxoChain: FakeUtxoChain = {
  tipHeight: 100,
  transactions: [
    {
      id: "funding",
      receivedAt: "2026-10-01T00:00:00.000Z",
      block: { height: 90, hash: "block-90", time: "2026-10-01T01:30:00.000Z" },
      fees: "1000",
      replaceable: false,
      inputs: [{ txid: "outside", vout: 0, address: OTHER, value: "60000" }],
      outputs: [{ index: 0, address: utxoAddress(0, 0), value: "59000" }],
    },
    {
      // A confirmed output the coin selection can spend.
      id: "received",
      receivedAt: "2026-10-01T00:00:00.000Z",
      block: { height: 95, hash: "block-95", time: "2026-10-01T01:35:00.000Z" },
      fees: "1000",
      replaceable: false,
      inputs: [{ txid: "elsewhere", vout: 1, address: OTHER, value: "30000" }],
      outputs: [{ index: 0, address: utxoAddress(0, 1), value: "29000" }],
    },
    {
      id: "pending-send",
      receivedAt: "2026-10-01T00:00:00.000Z",
      block: null,
      fees: "500",
      replaceable: true,
      inputs: [{ txid: "funding", vout: 0, address: utxoAddress(0, 0), value: "59000" }],
      outputs: [
        { index: 0, address: OTHER, value: "10000" },
        { index: 1, address: utxoAddress(1, 0), value: "48500" },
      ],
    },
  ],
};

/** What a hook of the staking screens answers once its reads settled. */
async function renderHookOnce<T>(useHook: () => T): Promise<T> {
  let value: T | undefined;
  // react-test-renderer warns it is deprecated; the hook runs the same.
  const warnings = jest.spyOn(console, "error").mockImplementation(() => {});
  const Probe = () => {
    value = useHook();
    return null;
  };
  await act(async () => {
    TestRenderer.create(createElement(Probe));
  });
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  warnings.mockRestore();
  return value as T;
}

const evmCoinConfig = {
  node: { type: "external", uri: "https://node.test" },
  explorer: { type: "etherscan", uri: "https://explorer.test" },
  gasTracker: { type: "ledger", explorerId: "eth" },
};

const SCENARIOS: Record<string, Scenario> = {
  ripple: {
    currency: getCryptoCurrencyById("ripple"),
    address: "rMine",
    module: singleAddress(
      chainOf("rMine", [{ value: 30_000_000n, locked: 10_000_000n, asset: native }]),
    ),
    transaction: account => send(account),
  },
  tron: {
    currency: getCryptoCurrencyById("tron"),
    address: "TMine",
    module: singleAddress(
      chainOf(
        "TMine",
        [
          { value: 5_000_000n, asset: native },
          {
            value: 100n,
            asset: { type: "trc20", assetReference: USDT.contractAddress, assetOwner: "TMine" },
          },
        ],
        { accountInfo: { type: "tron", activated: false } },
      ),
    ),
    transaction: account =>
      send(account, { subAccountId: account.subAccounts?.[0]?.id, amount: new BigNumber(1) }),
  },
  stellar: {
    currency: getCryptoCurrencyById("stellar"),
    address: "GMINE",
    module: singleAddress(
      chainOf("GMINE", [{ value: 30_000_000n, locked: 15_000_000n, asset: native }]),
    ),
    transaction: account => send(account, { memoType: "MEMO_TEXT", memoValue: "hi" }),
  },
  stacks: {
    currency: getCryptoCurrencyById("stacks"),
    address: "SPMINE",
    module: singleAddress(chainOf("SPMINE", [{ value: 10_000n, asset: native }])),
    transaction: account => send(account),
  },
  cardano: {
    currency: getCryptoCurrencyById("cardano"),
    address: "addr1mine",
    module: singleAddress(chainOf("addr1mine", [{ value: 5_000_000n, asset: native }])),
    transaction: account => send(account),
  },
  solana: {
    currency: getCryptoCurrencyById("solana"),
    address: "SoLMine",
    module: singleAddress(
      chainOf("SoLMine", [{ value: 5_000_000_000n, locked: 890_880n, asset: native }], {
        accountInfo: { type: "solana", tokenAccounts: {} },
      }),
    ),
    transaction: account =>
      send(account, {
        mode: "stake",
        recipient: "validator",
        valAddress: "validator",
        familySpecificData: { stakeAccountSeed: "stake:0.1" },
      } as Partial<GenericTransaction>),
  },
  tezos: {
    currency: getCryptoCurrencyById("tezos"),
    address: "tz1Mine",
    module: singleAddress(
      chainOf("tz1Mine", [{ value: 900n, asset: native }], {
        accountInfo: { type: "tezos", revealed: false },
      }),
    ),
    transaction: account => send(account),
  },
  cosmos: {
    currency: getCryptoCurrencyById("cosmos"),
    address: "cosmos1mine",
    module: singleAddress(
      chainOf("cosmos1mine", [{ value: 1_000_000n, asset: native }], {
        accountInfo: { type: "cosmos", redelegations: [] },
      }),
    ),
    transaction: account =>
      send(account, {
        mode: "redelegate",
        valAddress: "validator",
        dstValAddress: "other-validator",
      } as Partial<GenericTransaction>),
    deviceRawSigning: true,
  },
  hedera: {
    currency: getCryptoCurrencyById("hedera"),
    address: "0.0.1234",
    derivationMode: "hederaBip44",
    seedIdentifier: "hedera-key",
    module: singleAddress(
      chainOf("0.0.1234", [{ value: 10_000n, asset: native }], {
        accountInfo: { type: "hedera", stakedNodeId: -1, balance: "10000", pendingReward: "0" },
        addressesForPublicKey: publicKey => (publicKey === "hedera-key" ? ["0.0.1234"] : []),
      }),
    ),
    transaction: account => send(account),
    scan: true,
  },
  near: {
    currency: getCryptoCurrencyById("near"),
    address: "mine.near",
    module: singleAddress(chainOf("mine.near", [{ value: 10n ** 25n, asset: native }])),
    transaction: account =>
      send(account, { mode: "stake", recipient: "validator" } as Partial<GenericTransaction>),
    // O1: the NEAR validators of the staking screens.
    extras: () => renderHookOnce(() => useLedgerFirstShuffledValidatorsNear("")),
  },
  ethereum: {
    currency: getCryptoCurrencyById("ethereum"),
    address: EVM_ME,
    coinConfig: evmCoinConfig,
    module: evmChain,
    transaction: account =>
      send(account, {
        mode: "send",
        type: 2,
        gasLimit: new BigNumber(21_000),
      } as Partial<GenericTransaction>),
    extras: async account => {
      const extensions = await loadBridgeExtensionsForFamily("evm");
      const edited = {
        ...send(account),
        type: 2,
        nonce: 4,
        gasLimit: new BigNumber(21_000),
        maxFeePerGas: new BigNumber(12),
        maxPriorityFeePerGas: new BigNumber(1),
      } as never;
      return Promise.all([
        extensions.getEditTransactionPatch?.({ editType: "speedup", transaction: edited, account }),
        extensions.isTransactionConfirmed?.({ account, hash: "some-hash" }),
        // O2 and O3: the gas options of the send flow and an ERC-20 allowance.
        networkGasOptions(account.currency, true),
        getEvmTokenAllowance(account, USDC.id, "0x3333333333333333333333333333333333333333"),
        // O12: the swap live app's transaction lookup.
        getEvmTransactionByHash(account, "some-hash"),
      ]);
    },
  },
  // A staking chain: its validators, its redelegations, the Sei association (readiness).
  sei_evm: {
    currency: getCryptoCurrencyById("sei_evm"),
    address: EVM_ME,
    // coin-evm keys its staking registries on the chain id the coin config carries.
    coinConfig: { ...evmCoinConfig, chainId: CHAIN_ID.SEI_EVM },
    module: seiChain,
    transaction: account =>
      send(account, {
        mode: "send",
        type: 2,
        gasLimit: new BigNumber(21_000),
      } as Partial<GenericTransaction>),
    extras: async account => {
      const { id } = account.currency;
      const evmCtx = buildContext<EvmConfigInfo>(id);
      const config = await evmCtx.config();
      // O10: the validators of the staking screens, and their prefetch.
      prefetchValidators(config, evmCtx.logger);
      const state = await renderHookOnce<EvmStakingValidatorsState>(() =>
        useEvmStakingValidators(id),
      );
      if (state.error) throw state.error;
      if (state.validators.length === 0) throw new Error("no validator read");
      // O11: the Sei association warning.
      return [state.validators, await isSeiAccountUnassociated(config, account.freshAddress)];
    },
  },
  bitcoin: {
    currency: getCryptoCurrencyById("bitcoin"),
    address: utxoAddress(0, 0),
    derivationMode: "native_segwit",
    xpub: "xpubNoBypass",
    module: guard => fakeUtxoCoinModule(utxoChain, guard),
    transaction: account => send(account, { recipient: OTHER, amount: new BigNumber(1_000) }),
    deviceRawSigning: true,
    extras: async account => {
      const extensions = await loadBridgeExtensionsForFamily("bitcoin");
      const pending = {
        ...account,
        pendingOperations: [
          {
            id: `${account.id}-pending-send-OUT`,
            hash: "pending-send",
            type: "OUT",
            value: new BigNumber(10_500),
            fee: new BigNumber(500),
            senders: [utxoAddress(0, 0)],
            recipients: [OTHER],
            blockHeight: null,
            blockHash: null,
            accountId: account.id,
            date: new Date(),
            extra: { inputs: ["funding-0"] },
          },
        ],
      } as Account;
      const toUpdate = {
        ...send(account),
        familySpecificData: { replaceTxId: "pending-send", rbf: true },
      } as never;
      const patch = await extensions.getEditTransactionPatch?.({
        editType: "speedup",
        transaction: toUpdate,
        account: pending,
      });
      return Promise.all([
        patch,
        extensions.getEditTransactionPatch?.({
          editType: "cancel",
          transaction: toUpdate,
          account: pending,
        }),
        extensions.getEditTransactionStatus?.({
          account: pending,
          transaction: patch as never,
          transactionToUpdate: toUpdate,
          status: { errors: {}, warnings: {} } as never,
          editType: "speedup",
        } as never),
        extensions.hasMinimumFundsToCancel?.({
          mainAccount: pending,
          transactionToUpdate: toUpdate,
        }),
        extensions.hasMinimumFundsToSpeedUp?.({
          mainAccount: pending,
          transactionToUpdate: toUpdate,
        }),
        extensions.isTransactionConfirmed?.({ account: pending, hash: "funding" }),
      ]);
    },
  },
};

const EXTENSIONS = [
  "getFreshAddress",
  "getChangeAddress",
  "getAccountAddresses",
  "getAccountUtxos",
  "getAccountInfo",
  "call",
  "getAddressesForPublicKey",
  "getTransactionInfo",
  "validateTransaction",
  "encodeRawTransaction",
];

/** The service of `hybrid` mode: a portfolio of its own, on a coin module of the same chain. */
function serveService(scenario: Scenario): void {
  const { currency } = scenario;
  const module = scenario.module();
  const isUtxo = scenario.xpub !== undefined;
  const network = standInNetwork(
    currency as never,
    module as never,
    isUtxo
      ? bitcoinAccountModule(module as never, currency.id)
      : createSingleAddressAccountModule(module as never),
    isUtxo ? "auto_derive" : "static",
  );
  // The portfolio-service client implements no extension: hybrid routes those to the local side.
  const service: Record<string, unknown> = serviceStandIn(networkOf(currency.id), network);
  for (const extension of EXTENSIONS) delete service[extension];
  jest.mocked(createPortfolioServiceClient).mockReturnValue(service as never);
}

const signedOf = (events: SignOperationEvent[]) => {
  const signed = events.find(event => event.type === "signed");
  if (signed?.type !== "signed") throw new Error("not signed");
  return signed.signedOperation;
};

/** Every entry point of the scenario on `mode`; what each failed with. */
async function runEntryPoints(name: string, scenario: Scenario, mode: Path) {
  const { currency, address, coinConfig } = scenario;
  const family = currency.family;
  configure(currency, mode, { coinConfig, serviceUrl: SERVICE_URL, a4: A4_ON });
  // The service of `hybrid` mode; a `local` chain wires none, though a url is configured.
  if (mode !== "local") serveService(scenario);
  serveModule(scenario.module(method => guardCall(`${name} coin module ${method}`)));
  const device = { address };
  const signer = signerFor(device, scenario.seedIdentifier ?? "device-public-key");
  const bridge: AccountBridge<GenericTransaction> = await getCoinFrameworkAccountBridge(
    family,
    "local",
    signer,
  );
  const failures: Record<string, unknown> = {};
  const attempt = async <T>(entry: string, run: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await run();
    } catch (error) {
      failures[entry] = error instanceof Error ? error.message : error;
      return undefined;
    }
  };

  if (scenario.scan) {
    await attempt("scan", async () => {
      const currencyBridge = await getCoinFrameworkCurrencyBridge(family, "local", signer);
      return lastValueFrom(
        currencyBridge
          .scanAccounts({ currency, deviceId: "device", syncConfig: { paginationConfig: {} } })
          .pipe(toArray()),
      );
    });
  }

  const empty = emptyAccount(currency, address, {
    derivationMode: scenario.derivationMode,
    xpubOrAddress: scenario.xpub ?? address,
    seedIdentifier: scenario.seedIdentifier,
  });
  // sync and its postSync
  const account =
    (await attempt("sync", () =>
      lastValueFrom(bridge.sync(empty, { paginationConfig: {} }).pipe(toArray())).then(updates =>
        updates.reduce((held, update) => update(held), empty),
      ),
    )) ?? empty;
  device.address = account.freshAddress;

  await attempt("receive", () =>
    lastValueFrom(bridge.receive(account, { deviceId: "device", verify: true })),
  );
  const prepared =
    (await attempt("prepare", () =>
      bridge.prepareTransaction(account, scenario.transaction(account)),
    )) ?? scenario.transaction(account);
  await attempt("status", () => bridge.getTransactionStatus(account, prepared));
  await attempt("estimateMax", () =>
    bridge.estimateMaxSpendable({ account, parentAccount: null, transaction: prepared }),
  );
  const signed = await attempt("sign", async () =>
    signedOf(
      await lastValueFrom(
        bridge
          .signOperation({ account, transaction: prepared, deviceId: "device" })
          .pipe(toArray()),
      ),
    ),
  );
  if (signed) {
    await attempt("broadcast", () =>
      bridge.broadcast({
        account,
        signedOperation: signed,
        broadcastConfig: { mevProtected: true },
      }),
    );
  }
  if (!scenario.deviceRawSigning) {
    await attempt("signRaw", async () =>
      lastValueFrom(
        bridge.signRawOperation!({
          account,
          transaction: "raw-transaction",
          deviceId: "device",
        }).pipe(toArray()),
      ),
    );
  }
  await attempt("validateAddress", () =>
    bridge.validateAddress!(OTHER, { currencyId: currency.id, networkId: 1 }),
  );
  await attempt("getSponsoredCoinApi", () => getSponsoredCoinApi(currency.id, "local"));
  await attempt("buildGenericTransactionIntent", () =>
    buildGenericTransactionIntent(family, "local", account, prepared),
  );
  if (scenario.extras) await attempt("extras", () => scenario.extras!(account));

  return { failures, bypasses: takeBypasses(), account };
}

beforeAll(() => {
  useTokens([USDT, USDC]);
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

describe.each(["local", "hybrid"] as const)(
  "nothing goes around the portfolio layer (%s)",
  mode => {
    it.each(Object.keys(SCENARIOS))("%s", async name => {
      const { failures, bypasses, account } = await runEntryPoints(name, SCENARIOS[name], mode);
      expect(bypasses).toEqual([]);
      expect(failures).toEqual({});
      expect(account.blockHeight).toBeGreaterThan(0);
      // On the portfolio layer, in its mode (a family with a binding keeps no syncHash).
      expect(account.syncHash ?? `portfolio-${mode}-binding`).toMatch(`portfolio-${mode}-`);
      // The service side is wired in hybrid mode only, a stand-in of its own.
      if (mode === "local") expect(createPortfolioServiceClient).not.toHaveBeenCalled();
      else expect(createPortfolioServiceClient).toHaveBeenCalled();
    });
  },
);

describe("the guards", () => {
  it("catch the legacy path, which calls the coin module itself", async () => {
    const { bypasses } = await runEntryPoints("ripple", SCENARIOS.ripple, "legacy");
    expect(bypasses).toEqual(
      expect.arrayContaining([
        "ripple coin module getBalance",
        "ripple coin module craftTransactionData",
        "ripple coin module getNextSequence",
        "ripple coin module validateAddress",
        // A4 registers the account and serves its operations there.
        "A4Client",
      ]),
    );
  });

  it("fail a call made around the portfolio layer", async () => {
    const module = fakeCoinModule(chainOf("rMine", []), method =>
      guardCall(`coin module ${method}`),
    );
    expect(() => module.lastBlock()).toThrow("around the portfolio layer");
    expect(() => (axios.defaults.adapter as unknown as () => void)()).toThrow(
      "axios was called around the portfolio layer",
    );
    expect(() => (global.fetch as unknown as () => void)()).toThrow(
      "fetch was called around the portfolio layer",
    );
    expect(takeBypasses()).toEqual(["coin module lastBlock", "axios", "fetch"]);
  });
});
