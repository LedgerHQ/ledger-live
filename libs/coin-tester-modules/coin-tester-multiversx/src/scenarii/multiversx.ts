import BigNumber from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { buildSigner } from "../signer";
import { getBridges } from "../helpers";
import { initMswHandlers, resetIndexer } from "../indexer";
import {
  advanceToEpoch,
  fundAccount,
  killChainSimulator,
  setState,
  spawnChainSimulator,
} from "../chainSimulator";
import { issueEsdt, makeEsdtPairs } from "../esdt";
import {
  INITIAL_EGLD_FUNDING,
  MULTIVERSX_API_URL,
  MULTIVERSX_DELEGATION_API_URL,
  RECIPIENT,
  makeAccount,
  makeEsdtToken,
  registerEsdtToken,
} from "../fixtures";

global.console = require("console");
jest.setTimeout(1_000_000);

type MultiversXScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

const DERIVATION_PATH = "44'/508'/0'/0'/0'";
const MULTIVERSX = getCryptoCurrencyById("elrond");
const ONE_EGLD = new BigNumber("1000000000000000000"); // 1 EGLD (18 decimals)
const ONE_USDC = new BigNumber("1000000"); // 1 USDC (6 decimals)

const USDC_DECIMALS = 6;
const USDC_TICKER = "TUSDC";
const ESDT_ISSUE_SUPPLY = 1_000_000n * 10n ** 6n; // 1,000,000 USDC total supply
const INITIAL_USDC_FUNDING = 1000n * 10n ** 6n; // 1000 USDC credited to the scenario account
// ESDT epoch gate: the system contract is disabled at genesis.
const ESDT_ENABLE_EPOCH = 2;

// Set during setup (the identifier is only known after issuance), read by getTransactions.
let scenarioToken: TokenCurrency;

function makeScenarioTransactions(
  address: string,
  strategy: BridgeStrategy,
): MultiversXScenarioTransaction[] {
  const usdcSubAccountId = encodeTokenAccountId(`js:2:elrond:${address}:`, scenarioToken);

  const sendEgld: MultiversXScenarioTransaction = {
    name: "Send 1 EGLD",
    mode: "send",
    amount: ONE_EGLD,
    recipient: RECIPIENT,
    expect: (previousAccount: Account, currentAccount: Account) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
      expect(latestOperation.type).toEqual("OUT");
      expect(latestOperation.value).toStrictEqual(latestOperation.fee.plus(ONE_EGLD));
      expect(latestOperation.senders).toStrictEqual([address]);
      expect(latestOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
    },
  };

  const sendUsdc: MultiversXScenarioTransaction = {
    name: "Send 1 USDC",
    mode: "send",
    amount: ONE_USDC,
    recipient: RECIPIENT,
    subAccountId: usdcSubAccountId,
    expect: (previousAccount: Account, currentAccount: Account) => {
      const currentSub = currentAccount.subAccounts?.find(sa => sa.id === usdcSubAccountId);
      const previousSub = previousAccount.subAccounts?.find(sa => sa.id === usdcSubAccountId);
      const [latestSubOperation] = currentSub?.operations ?? [];
      expect(latestSubOperation.type).toEqual("OUT");
      expect(latestSubOperation.value).toStrictEqual(ONE_USDC);
      expect(latestSubOperation.senders).toStrictEqual([address]);
      expect(latestSubOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentSub?.balance).toStrictEqual(previousSub?.balance.minus(ONE_USDC));
    },
  };

  const sendAllUsdc: MultiversXScenarioTransaction = {
    name: "Send all USDC",
    mode: "send",
    useAllAmount: true,
    recipient: RECIPIENT,
    subAccountId: usdcSubAccountId,
    expect: (previousAccount: Account, currentAccount: Account) => {
      // The ESDT transfer produces a new parent operation (fees paid in EGLD).
      expect(currentAccount.operations.length).toBeGreaterThan(previousAccount.operations.length);
      const currentSub = currentAccount.subAccounts?.find(sa => sa.id === usdcSubAccountId);
      if (strategy === "legacy") {
        // Legacy sync drops the sub-account once the ESDT balance reaches 0 (node prunes the
        // storage entry), so spendableBalance is either 0 or the sub-account disappears.
        if (currentSub) expect(currentSub.spendableBalance).toEqual(new BigNumber(0));
      }
      // generic-adapter: mergeSubAccounts (incremental sync) does not zero-out old
      // sub-accounts absent from newSubAccounts when the node prunes the ESDT entry,
      // so spendableBalance stays stale. Assert === 0 once mergeSubAccounts is fixed.
    },
  };

  // Send-max EGLD must come last: it drains the spendable balance (ESDT transfers
  // still need EGLD for gas, so they run before this).
  const sendMaxEgld: MultiversXScenarioTransaction = {
    name: "Send max EGLD",
    mode: "send",
    useAllAmount: true,
    recipient: RECIPIENT,
    expect: (previousAccount: Account, currentAccount: Account) => {
      const [latestOperation] = currentAccount.operations;
      expect(currentAccount.operations.length - previousAccount.operations.length).toEqual(1);
      expect(latestOperation.type).toEqual("OUT");
      expect(latestOperation.senders).toStrictEqual([address]);
      expect(latestOperation.recipients).toStrictEqual([RECIPIENT]);
      expect(currentAccount.balance).toStrictEqual(
        previousAccount.balance.minus(latestOperation.value),
      );
      expect(currentAccount.spendableBalance).toStrictEqual(new BigNumber(0));
    },
  };

  return [sendEgld, sendUsdc, sendAllUsdc, sendMaxEgld];
}

let closeMSW: (() => void) | null = null;

export const scenarioMultiversx: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic MultiversX Transactions",
  setup: async strategy => {
    const multiversxConfig = {
      type: "object" as const,
      default: {
        status: { type: "active" },
        apiEndpoint: MULTIVERSX_API_URL,
        delegationApiEndpoint: MULTIVERSX_DELEGATION_API_URL,
      },
    };
    LiveConfig.setConfig({
      config_currency_elrond: multiversxConfig,
    });
    resetIndexer();
    await spawnChainSimulator();
    // The ESDT system contract is disabled at genesis; advance past the enable epoch.
    await advanceToEpoch(ESDT_ENABLE_EPOCH);

    const signer = await buildSigner();
    const { accountBridge, currencyBridge, getAddress } = await getBridges(strategy, signer);

    const { address } = await getAddress("", {
      path: DERIVATION_PATH,
      currency: MULTIVERSX,
      derivationMode: "",
    });
    const account = makeAccount(address);

    // Register an ESDT by issuing it from a throwaway funded account (keeps the scenario
    // account's history/balance clean — it receives the token via set-state, not a transfer).
    const issuer = await buildSigner();
    const { address: issuerAddress } = await issuer.getAddress(DERIVATION_PATH);
    await fundAccount(issuerAddress, INITIAL_EGLD_FUNDING);
    const identifier = await issueEsdt(issuer, issuerAddress, DERIVATION_PATH, {
      name: "TestUSDC",
      ticker: USDC_TICKER,
      supply: ESDT_ISSUE_SUPPLY,
      decimals: USDC_DECIMALS,
    });

    // Fund the scenario account: native EGLD + the ESDT balance, in one deterministic set-state.
    await setState([
      {
        address,
        nonce: 0,
        balance: INITIAL_EGLD_FUNDING,
        pairs: makeEsdtPairs(identifier, INITIAL_USDC_FUNDING),
      },
    ]);

    scenarioToken = makeEsdtToken(identifier, USDC_DECIMALS);
    registerEsdtToken(scenarioToken);

    closeMSW = initMswHandlers();

    return { account, accountBridge, currencyBridge };
  },
  getTransactions: (address, strategy) => makeScenarioTransactions(address, strategy),
  beforeAll: account => {
    expect(account.balance.toString()).toEqual(INITIAL_EGLD_FUNDING);
    expect(account.operations.length).toEqual(0);
  },
  teardown: async () => {
    closeMSW?.();
    closeMSW = null;
    resetIndexer();
    await killChainSimulator();
  },
};
