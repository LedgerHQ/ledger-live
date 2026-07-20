import BigNumber from "bignumber.js";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { Account } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { INITIAL_FUND_SOMPI, ONE_KAS, makeAccount, makeGenericAdapterAccount, initMSW } from "../fixtures";
import { buildSigners, deriveAddress, KASPA_TEST_MNEMONIC, KASPA_RECIPIENT_MNEMONIC } from "../signer";
import { toSimnetAddress } from "../addressUtils";
import { spawnKaspaNode, killKaspaNode, waitForBalance, waitForUtxos, waitForMatureUtxos } from "../kaspaNode";
import { getBridges } from "../helpers";

// At least this many UTXOs before the multi-UTXO send (kaspad mines ~1 UTXO/block after maturity)
const MULTI_UTXO_MIN = 5;

// Settle delay before each sync so kaspa-rest-server indexes the latest blocks from kaspad
const SETTLE_MS = 3_000;

// Module-level state set by setup() and read by getTransactions()
let recipient = "";
let stopMSW: (() => void) | null = null;

export const scenarioKaspa: Scenario<GenericTransaction, Account> = {
  name: "Kaspa",

  setup: async (strategy: BridgeStrategy) => {
    // Required by createLocalKaspaApi → getCurrencyConfiguration("kaspa"). Kaspa's CoinConfig
    // is the base CurrencyConfig (status only), so no chain-specific fields are needed.
    // Same pattern as coin-tester-cardano's scenario setup().
    LiveConfig.setConfig({
      config_currency_kaspa: {
        type: "object",
        default: { status: { type: "active" } },
      },
    });

    stopMSW = initMSW();

    // Derive test account address (BIP44 44'/111111'/0'/0/0 of test mnemonic).
    // coin-kaspa hardcodes kaspa: prefix; kaspad simnet uses kaspasim: for mining.
    // We mine to toSimnetAddress(testAddress) but query the REST server with kaspa: addresses.
    const testAddress = await deriveAddress(KASPA_TEST_MNEMONIC, 0, 0);

    // Recipient: derived from a different mnemonic so the legacy bridge's HD scanner
    // never discovers it as a wallet address (which would make sends look like internal transfers).
    recipient = await deriveAddress(KASPA_RECIPIENT_MNEMONIC, 0, 0);

    const signers = await buildSigners(KASPA_TEST_MNEMONIC);

    // Mine directly to the test account — coinbase rewards fund it (one UTXO per block)
    // kaspad --simnet validates the mining-address prefix; must pass kaspasim: not kaspa:
    await spawnKaspaNode(toSimnetAddress(testAddress));
    // waitForBalance/waitForUtxos talk to REST server (NETWORK_TYPE=mainnet) with kaspa: address
    await waitForBalance(testAddress, INITIAL_FUND_SOMPI);
    await waitForUtxos(testAddress, MULTI_UTXO_MIN);
    await waitForMatureUtxos(testAddress, MULTI_UTXO_MIN);

    const { currencyBridge, accountBridge } = await getBridges(strategy, signers);

    // Account construction differs by strategy:
    //
    //   legacy: id encodes the 99-byte xpub; synchronization.ts extracts it and scans all HD
    //     addresses via scanAddresses(compressedPublicKey, chainCode). UTXOs are found across
    //     all used addresses even after freshAddress has advanced.
    //
    //   generic-adapter: id encodes the kaspa: address itself (single-address model, mirroring
    //     Solana's pattern). makeSync extracts the address from the id and passes it to
    //     coinModuleApi.getBalance/listOperations. craftTransaction then queries UTXOs for
    //     intent.sender = account.freshAddress = testAddress (the funded address). freshAddress
    //     is NOT advanced by genericGetAccountShape, so the funded address stays correct.
    const account =
      strategy === "legacy"
        ? makeAccount(testAddress, (await signers.bridge.getAddress("44'/111111'/0'/0/0")).publicKey)
        : makeGenericAdapterAccount(testAddress);

    return {
      currencyBridge,
      accountBridge,
      account,
      retryInterval: 4_000,
      retryLimit: 15,
    };
  },

  beforeSync: async () => {
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
  },

  beforeAll: async (account: Account) => {
    expect(account.balance.toNumber()).toBeGreaterThanOrEqual(Number(INITIAL_FUND_SOMPI));
    // Mining goes to the test address, so the initial sync finds coinbase transactions.
    expect(account.operationsCount).toBeGreaterThan(0);
  },

  afterAll: async (account: Account) => {
    expect(account.operationsCount).toBeGreaterThanOrEqual(4);
  },

  getTransactions: (_address: string): ScenarioTransaction<GenericTransaction, Account>[] => [
    // #1 — Fixed-amount send (100 KAS)
    {
      name: "Send 100 KAS (fixed)",
      amount: new BigNumber(100 * ONE_KAS),
      recipient,
      useAllAmount: false,
      expect: (prev: Account, curr: Account) => {
        expect(curr.operationsCount).toBeGreaterThanOrEqual(prev.operationsCount + 1);
        const prevIds = new Set(prev.operations.map(o => o.id));
        const op = curr.operations.find(o => !prevIds.has(o.id) && o.type === "OUT");
        expect(op).toBeDefined();
        // value = amount + fee (both legacy and generic-adapter conventions converge here)
        expect(op!.value.toNumber()).toBeGreaterThan(100 * ONE_KAS);
        expect(op!.fee.toNumber()).toBeGreaterThan(0);
      },
    },

    // #4 — Multi-UTXO consolidation send (200 KAS — requires multiple input UTXOs)
    // The account has MULTI_UTXO_MIN+ UTXOs from mining; the UTXO selector must use several.
    {
      name: "Send 200 KAS (multi-UTXO)",
      amount: new BigNumber(200 * ONE_KAS),
      recipient,
      useAllAmount: false,
      expect: (prev: Account, curr: Account) => {
        expect(curr.operationsCount).toBeGreaterThanOrEqual(prev.operationsCount + 1);
        const prevIds = new Set(prev.operations.map(o => o.id));
        const op = curr.operations.find(o => !prevIds.has(o.id) && o.type === "OUT");
        expect(op).toBeDefined();
        expect(op!.value.toNumber()).toBeGreaterThan(200 * ONE_KAS);
      },
    },

    // #3 — Custom-fee send (50 KAS with explicit fee override)
    {
      name: "Send 50 KAS with custom fee",
      amount: new BigNumber(50 * ONE_KAS),
      recipient,
      useAllAmount: false,
      fees: new BigNumber(10_000), // 10_000 sompi; above mass-estimated minimum for a simple tx
      expect: (prev: Account, curr: Account) => {
        expect(curr.operationsCount).toBeGreaterThanOrEqual(prev.operationsCount + 1);
        const prevIds = new Set(prev.operations.map(o => o.id));
        const op = curr.operations.find(o => !prevIds.has(o.id) && o.type === "OUT");
        expect(op).toBeDefined();
        expect(op!.fee.toNumber()).toBeGreaterThan(0);
      },
    },

    // #2 — Send max (last — drains spendable balance to zero)
    {
      name: "Send max (drain)",
      amount: new BigNumber(0),
      recipient,
      useAllAmount: true,
      expect: (prev: Account, curr: Account) => {
        const prevIds = new Set(prev.operations.map(o => o.id));
        const op = curr.operations.find(o => !prevIds.has(o.id) && o.type === "OUT");
        expect(op).toBeDefined();
        // spendableBalance includes all UTXOs (mature + immature coinbase); craftTransaction
        // only spends mature UTXOs, so the sent amount can be less than total balance.
        // Verify the send-max operation exists and sent a non-trivial amount.
        expect(op!.value.toNumber()).toBeGreaterThan(0);
      },
    },
  ],

  teardown: async () => {
    stopMSW?.();
    await killKaspaNode();
  },
};
