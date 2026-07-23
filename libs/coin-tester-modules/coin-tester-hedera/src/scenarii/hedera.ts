import {
  AccountCreateTransaction,
  Client,
  Hbar,
  PrivateKey,
  PublicKey,
  TransactionId,
} from "@hashgraph/sdk";
import type { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Transaction } from "@ledgerhq/coin-hedera/types";
import type { HederaAccount } from "@ledgerhq/coin-hedera/types";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/coin-hedera/constants";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import BigNumber from "bignumber.js";
import {
  HEDERA,
  LOCAL_CONSENSUS_NODES,
  LOCAL_MIRROR_NODE_URL,
  RECIPIENT,
  makeHederaAccount,
} from "../fixtures";
import { buildHederaSigner } from "../signer";
import { getBridges } from "../helpers";
import { deploySolo, teardownSolo } from "../solo";
import { getHgraphObserver, initMswHandlers } from "../indexer";

const ONE_HBAR_IN_TINYBAR = 100_000_000;
const INITIAL_BALANCE_HBAR = 100;

// Mirror node indexes accounts asynchronously; evm_address can be unset right after the
// receipt returns, and coin-hedera's getAccountShape throws hard on that with no retry.
async function waitForMirrorNodeEvmAddress(accountId: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const res = await fetch(`${LOCAL_MIRROR_NODE_URL}/api/v1/accounts/${accountId}`).catch(
      () => undefined,
    );
    if (res?.ok) {
      const body = (await res.json()) as { evm_address?: string | null };
      if (body.evm_address) return;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(
    `hedera scenario setup: mirror node never populated evm_address for ${accountId} within 30s`,
  );
}

type HederaScenarioTransaction = ScenarioTransaction<Transaction, HederaAccount>;

let closeMswHandlers: (() => void) | undefined;

function makeTransactions(): HederaScenarioTransaction[] {
  const sendOneHbar: HederaScenarioTransaction = {
    name: "Send 1 HBAR to an existing recipient",
    family: "hedera",
    mode: HEDERA_TRANSACTION_MODES.Send,
    amount: new BigNumber(ONE_HBAR_IN_TINYBAR),
    recipient: RECIPIENT,
    expect: (previous, current) => {
      // Assert (not destructure) so an empty list from mirror-node lag is a retryable
      // Jest failure, not a hard TypeError.
      expect(current.operations.length).toBeGreaterThan(0);
      const [latest] = current.operations;
      expect(latest.type).toBe("OUT");
      expect(latest.recipients).toContain(RECIPIENT);
      // `value` already includes the fee (mirror node reports the fee-inclusive net change);
      // subtracting `fee` too would double-count it.
      expect(current.balance).toStrictEqual(previous.balance.minus(latest.value));
    },
  };

  return [sendOneHbar];
}

export const scenarioHedera: Scenario<Transaction, HederaAccount> = {
  name: "Ledger Live Hedera — send 1 HBAR",

  setup: async () => {
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    });

    const { genesisOperatorKey } = await deploySolo();

    const signer = buildHederaSigner();
    const { currencyBridge, accountBridge, getAddress } = await getBridges(signer);

    const { publicKey } = await getAddress("", {
      path: "44/3030",
      currency: HEDERA,
      derivationMode: "hederaBip44",
    });

    closeMswHandlers = initMswHandlers();

    // scheduleNetworkUpdate:false — Solo exposes consensus on a custom port
    // (35211); the SDK's periodic address-book refresh would otherwise replace
    // the topology with default ports (50211/50212). There is no address book
    // to fetch on a one-shot local node anyway.
    const genesisClient = Client.forNetwork(LOCAL_CONSENSUS_NODES, {
      scheduleNetworkUpdate: false,
    });
    genesisClient.setOperator("0.0.2", PrivateKey.fromStringED25519(genesisOperatorKey));

    const receipt = await new AccountCreateTransaction()
      .setKeyWithoutAlias(PublicKey.fromString(publicKey))
      .setInitialBalance(new Hbar(INITIAL_BALANCE_HBAR))
      .setTransactionId(TransactionId.generate("0.0.2"))
      .execute(genesisClient)
      .then(response => response.getReceipt(genesisClient));

    const accountId = receipt.accountId?.toString();
    if (!accountId) {
      throw new Error("hedera scenario setup: AccountCreateTransaction receipt has no accountId");
    }

    genesisClient.close();

    await waitForMirrorNodeEvmAddress(accountId);

    const account = makeHederaAccount(accountId, publicKey);

    return {
      currencyBridge,
      accountBridge,
      account,
      // Absorbs the mirror node's lag behind consensus.
      retryInterval: 2000,
      retryLimit: 20,
    };
  },

  getTransactions: () => makeTransactions(),

  afterAll: () => {
    const observer = getHgraphObserver();
    console.warn(
      `hgraph observer: ${observer.callCount} call(s) — ${observer.queries.join(" | ")}`,
    );
  },

  teardown: async () => {
    closeMswHandlers?.();
    await teardownSolo();
  },
};
