import { getBech32PoolId } from "@ledgerhq/coin-cardano/logic";
import { extractPaymentKeyFromAddress } from "@ledgerhq/coin-cardano/utils";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import type { Scenario } from "@ledgerhq/coin-tester/main";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CARDANO, FRESH_ADDRESS_PATH, makeAccount } from "../fixtures";
import { getBridges } from "../helpers";
import { fund, initMSW, resetLedger } from "../indexer";
import { buildSigner } from "../signer";

const ONE_ADA = 1_000_000n;
const INITIAL_FUNDING = 10n * ONE_ADA;
const SEND_AMOUNT = new BigNumber(2_000_000);
const SECOND_SEND_AMOUNT = new BigNumber(1_000_000);
// A valid mainnet base address distinct from the test account's.
const RECIPIENT =
  "addr1qxqm3nxwzf70ke9jqa2zrtrevjznpv6yykptxnv34perjc8a7zgxmpv5pgk4hhhe0m9kfnlsf5pt7d2ahkxaul2zygrq3nura9";
// Pool to delegate to: a 28-byte (56 hex) pool key hash. craftTransaction passes it straight into
// the stake_delegation certificate; the indexer decodes it back and reports the bech32 pool id.
const POOL_HASH = "00112233445566778899aabbccddeeff00112233445566778899aabb";
const EXPECTED_POOL_ID = getBech32PoolId(POOL_HASH, "cardano");

type StakingResourcesShape = {
  delegations: Array<{ validatorAddress: string; amount: BigNumber }>;
};

// stakingResources is set by the generic-coin-framework bridge but not typed on Account.
function getStakingResources(account: Account): StakingResourcesShape | undefined {
  return (account as Account & { stakingResources?: StakingResourcesShape }).stakingResources;
}

// A fixed-amount send: the newest OUT op debits amount + fee, and the balance drops by exactly
// that op value. Shared by the two fixed sends below.
function expectFixedSend(amount: BigNumber) {
  return (previousAccount: Account, currentAccount: Account) => {
    const [latest] = currentAccount.operations;
    expect(latest.type).toBe("OUT");
    // OUT value = amount + fee, so it strictly exceeds the sent amount.
    expect(latest.value.gt(amount)).toBe(true);
    expect(currentAccount.balance.toString()).toBe(
      previousAccount.balance.minus(latest.value).toString(),
    );
    expect(currentAccount.operations.length).toBe(previousAccount.operations.length + 1);
  };
}

let closeMSW: (() => void) | undefined;

export const scenarioCardano: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Basic Cardano Transactions",

  setup: async () => {
    // CARDANO_API_ENDPOINT is pointed at the mock in env.setup.ts (must precede module load).
    LiveConfig.setConfig({
      config_currency_cardano: {
        type: "object",
        default: { status: { type: "active" }, maxFeesWarning: 0, maxFeesError: 0 },
      },
    });
    closeMSW = initMSW();

    const signer = await buildSigner();
    const { accountBridge, currencyBridge, getAddress } = await getBridges(signer);
    const { address } = await getAddress("", {
      path: FRESH_ADDRESS_PATH,
      currency: CARDANO,
      derivationMode: "",
    });

    fund(extractPaymentKeyFromAddress(address), address, INITIAL_FUNDING);

    return { accountBridge, currencyBridge, account: makeAccount(address), retryLimit: 0 };
  },

  beforeAll: account => {
    expect(account.balance.toString()).toBe(INITIAL_FUNDING.toString());
    expect(account.operations.length).toBe(1);
    expect(account.operations[0].type).toBe("IN");
  },

  // nonce: 0 — Cardano is UTXO (no account sequence). The generic signOperation otherwise calls
  // coinModuleApi.getNextSequence, which coin-cardano throws on ("not applicable for Cardano");
  // supplying a (UTXO-meaningless) sequence via nonce skips that call. craftTransaction ignores it.
  getTransactions: () => [
    {
      name: "Send 2 ADA",
      amount: SEND_AMOUNT,
      recipient: RECIPIENT,
      nonce: new BigNumber(0),
      expect: expectFixedSend(SEND_AMOUNT),
    },
    {
      // Multi-send: the framework resyncs before this tx, so it must spend the change UTXO
      // produced by the first send (the funding UTXO is already consumed).
      name: "Send 1 ADA (spends prior change)",
      amount: SECOND_SEND_AMOUNT,
      recipient: RECIPIENT,
      nonce: new BigNumber(0),
      expect: expectFixedSend(SECOND_SEND_AMOUNT),
    },
    {
      // Delegate to a pool: moves no ADA (only fee + a refundable 2 ADA stake-key deposit), yields
      // a DELEGATE op, and flips the indexer's /v1/delegation to active so the stake surfaces.
      name: "Delegate to pool",
      mode: "delegate",
      valAddress: POOL_HASH,
      amount: new BigNumber(0),
      nonce: new BigNumber(0),
      expect: (previousAccount, currentAccount) => {
        const [latest] = currentAccount.operations;
        expect(latest.type).toBe("DELEGATE");
        expect(currentAccount.operations.length).toBe(previousAccount.operations.length + 1);

        // The pool id doesn't survive on the operation (the generic adapter drops op.details),
        // so it's asserted via the delegation that now surfaces on the synced account
        // (getBalance → /v1/delegation).
        const delegations = getStakingResources(currentAccount)?.delegations ?? [];
        expect(delegations).toHaveLength(1);
        expect(delegations[0].validatorAddress).toBe(EXPECTED_POOL_ID);

        // Spendable balance drops by fee + the 2 ADA deposit, which leaves the UTXO set.
        expect(currentAccount.balance.lt(previousAccount.balance)).toBe(true);
      },
    },
    {
      // Send-max: useAllAmount routes the whole remaining balance (minus fee) to the recipient
      // via change, leaving the account empty.
      name: "Send Max",
      useAllAmount: true,
      recipient: RECIPIENT,
      nonce: new BigNumber(0),
      expect: (previousAccount, currentAccount) => {
        const [latest] = currentAccount.operations;
        expect(latest.type).toBe("OUT");
        // The whole previous balance leaves: OUT value = sweep amount + fee = prior balance.
        expect(latest.value.toString()).toBe(previousAccount.balance.toString());
        expect(currentAccount.balance.toString()).toBe("0");
        expect(currentAccount.operations.length).toBe(previousAccount.operations.length + 1);
      },
    },
  ],

  afterAll: account => {
    expect(account.operations.length).toBe(5); // funding IN + 2 OUT + DELEGATE + send-max OUT
    expect(account.balance.toString()).toBe("0");
    // The stake-key deposit stays locked in the (still active) delegation after the account empties.
    expect(getStakingResources(account)?.delegations).toHaveLength(1);
  },

  teardown: async () => {
    closeMSW?.();
    resetLedger();
  },
};
