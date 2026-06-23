import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { Scenario } from "@ledgerhq/coin-tester/main";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CARDANO_TESTNET, FRESH_ADDRESS_PATH, makeAccount } from "../fixtures";
import { getBridges, TESTNET } from "../helpers";
import { buildSigner } from "../signer";
import { killYaci, spawnYaci, topup } from "../yaci";
import { initYaciIndexer, registerAddress, resetRegisteredAddresses } from "../yaciIndexer";

const FUNDING_ADA = 10_000;
const SEND_AMOUNT = new BigNumber(2_000_000);
const SECOND_SEND_AMOUNT = new BigNumber(1_000_000);
const MEMO = "coin-tester memo";
// A second account-index address (addr_test) to receive the sends.
const RECIPIENT_PATH = "1852'/1815'/1'/0/0";

let closeIndexer: (() => void) | undefined;
let recipient = "";

// A fixed-amount send: newest OUT op debits amount + fee; balance drops by exactly that op value.
function expectFixedSend(amount: BigNumber) {
  return (previousAccount: Account, currentAccount: Account) => {
    const [latest] = currentAccount.operations;
    expect(latest.type).toBe("OUT");
    expect(latest.value.gt(amount)).toBe(true); // amount + fee
    expect(currentAccount.balance.toString()).toBe(
      previousAccount.balance.minus(latest.value).toString(),
    );
    expect(currentAccount.operations.length).toBe(previousAccount.operations.length + 1);
  };
}

// Native ADA sends against a real Yaci devnet (testnet). Staking stays on the in-memory mock
// (scenarii/cardano.ts) — real-node staking needs multi-witness signing (deferred).
export const scenarioCardanoYaci: Scenario<GenericTransaction, Account> = {
  name: "Cardano native sends (Yaci devnet)",

  setup: async () => {
    LiveConfig.setConfig({
      config_currency_cardano_testnet: {
        type: "object",
        default: { status: { type: "active" }, maxFeesWarning: 0, maxFeesError: 0 },
      },
    });

    await spawnYaci();
    closeIndexer = initYaciIndexer();

    const signer = await buildSigner();
    const { accountBridge, currencyBridge, getAddress } = await getBridges(signer, TESTNET);

    const { address } = await getAddress("", {
      path: FRESH_ADDRESS_PATH,
      currency: CARDANO_TESTNET,
      derivationMode: "",
    });
    recipient = (await signer.getAddress(RECIPIENT_PATH, TESTNET.networkId)).address;

    registerAddress(address, TESTNET.networkId);
    await topup(address, FUNDING_ADA);

    return {
      accountBridge,
      currencyBridge,
      account: makeAccount(address, CARDANO_TESTNET),
      // Real devnet: poll while the funding/sends confirm in blocks.
      retryLimit: 20,
      retryInterval: 2_000,
    };
  },

  beforeAll: account => {
    expect(account.balance.gt(0)).toBe(true);
    expect(account.operations.length).toBeGreaterThanOrEqual(1);
    expect(account.operations.some(op => op.type === "IN")).toBe(true);
  },

  // nonce: 0 — Cardano is UTXO (no account sequence). The generic signOperation otherwise calls
  // coinModuleApi.getNextSequence, which coin-cardano throws on ("not applicable for Cardano");
  // supplying a (UTXO-meaningless) sequence via nonce skips that call. craftTransaction ignores it.
  getTransactions: () => [
    {
      name: "Send 2 ADA",
      amount: SEND_AMOUNT,
      recipient,
      nonce: new BigNumber(0),
      expect: expectFixedSend(SEND_AMOUNT),
    },
    {
      // Multi-send: the framework resyncs before this tx, so it spends the change UTXO from the first.
      name: "Send 1 ADA (spends prior change)",
      amount: SECOND_SEND_AMOUNT,
      recipient,
      nonce: new BigNumber(0),
      expect: expectFixedSend(SECOND_SEND_AMOUNT),
    },
    {
      // Send with a memo (CIP-20 metadata label 674). The adapter surfaces tx metadata so the synced
      // op carries the memo (getMemoFromTx → details.memo → op.extra.memo).
      name: "Send 2 ADA with memo",
      amount: SEND_AMOUNT,
      recipient,
      memoType: "string",
      memoValue: MEMO,
      nonce: new BigNumber(0),
      expect: (previousAccount, currentAccount) => {
        const [latest] = currentAccount.operations;
        expect(latest.type).toBe("OUT");
        expect((latest.extra as { memo?: string }).memo).toBe(MEMO);
      },
    },
    {
      name: "Send Max",
      useAllAmount: true,
      recipient,
      nonce: new BigNumber(0),
      expect: (previousAccount, currentAccount) => {
        const [latest] = currentAccount.operations;
        expect(latest.type).toBe("OUT");
        expect(latest.value.toString()).toBe(previousAccount.balance.toString());
        expect(currentAccount.balance.toString()).toBe("0");
        expect(currentAccount.operations.length).toBe(previousAccount.operations.length + 1);
      },
    },
  ],

  teardown: async () => {
    closeIndexer?.();
    resetRegisteredAddresses();
    await killYaci();
  },
};
