import BigNumber from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Transaction, TronAccount } from "@ledgerhq/coin-tron/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { fundAccount, spawnNode, killNode, waitForTxConfirmation } from "../node";
import { buildTronSigner } from "../signer";
import { getBridges } from "../helpers";
import {
  makeAccount,
  RECIPIENT,
  SENDER_MNEMONIC,
  TRON,
  TRON_DERIVATION_PATH,
} from "../fixtures";
import {
  deployTrc10,
  deployTrc20,
  type Trc10Fixture,
  type Trc20Fixture,
} from "../tokenFixtures";
import { initMswHandlers, resetIndexer } from "../indexer";

global.console = require("console");
jest.setTimeout(600_000);

type TronScenarioTransaction = ScenarioTransaction<Transaction, TronAccount>;

let closeMsw: (() => void) | null = null;
let trc10Fixture: Trc10Fixture | null = null;
let trc20Fixture: Trc20Fixture | null = null;
/** Captured from the first sync inside `beforeAll`. */
let trc10SubAccountId = "";
let trc20SubAccountId = "";

const INITIAL_FUNDING_SUN = 10_000 * 1_000_000; // 10,000 TRX

function buildTokenCurrencyFromTrc10(t: Trc10Fixture): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: t.calTokenId,
    ticker: t.abbr,
    name: t.name,
    units: [{ name: t.name, code: t.abbr, magnitude: t.precision }],
    tokenType: "trc10",
    parentCurrency: TRON,
    contractAddress: t.tokenId,
    disableCountervalue: false,
    delisted: false,
  };
}

function buildTokenCurrencyFromTrc20(t: Trc20Fixture): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: t.calTokenId,
    ticker: t.symbol,
    name: t.name,
    units: [{ name: t.name, code: t.symbol, magnitude: t.decimals }],
    tokenType: "trc20",
    parentCurrency: TRON,
    contractAddress: t.contractAddress,
    disableCountervalue: false,
    delisted: false,
  };
}

function registerTokensInMockStore(): void {
  const trc10Token = trc10Fixture ? buildTokenCurrencyFromTrc10(trc10Fixture) : null;
  const trc20Token = trc20Fixture ? buildTokenCurrencyFromTrc20(trc20Fixture) : null;

  setupMockCryptoAssetsStore({
    findTokenById: jest.fn(async (id: string) => {
      if (trc10Token && id === trc10Token.id) return trc10Token;
      if (trc20Token && id === trc20Token.id) return trc20Token;
      return undefined;
    }),
    findTokenByAddressInCurrency: jest.fn(
      async (addressOrId: string, currencyId: string) => {
        if (currencyId !== "tron") return undefined;
        if (trc20Token && addressOrId === trc20Token.contractAddress) return trc20Token;
        return undefined;
      },
    ),
  });
}

/**
 * Scenario ordering (plan risk #6): TRX sends drain balance, but token sends
 * still pay fees in TRX. Therefore: send 1 TRX → send 1 TRC-10 → send 1 TRC-20
 * → send-max TRC-10 → send-max TRC-20 → send-max TRX (last, leaves the
 * account empty for fees).
 */
function getTronTransactions(): TronScenarioTransaction[] {
  return [
    {
      name: "Send 1 TRX",
      amount: new BigNumber(1_000_000),
      recipient: RECIPIENT,
      expect: (prev, curr) => {
        expect(curr.operations.length).toBeGreaterThan(prev.operations.length);
        const [latest] = curr.operations;
        expect(latest.type).toBe("OUT");
        expect(latest.recipients).toContain(RECIPIENT);
        // Balance must have dropped by at least the sent amount. The on-chain
        // fee is not reported on op.fee for this older java-tron API, so we
        // can't tighten this assertion to an equality.
        expect(curr.balance.lte(prev.balance.minus(latest.value))).toBe(true);
      },
    },
    {
      name: "Send 1 TRC-10",
      subAccountId: trc10SubAccountId,
      amount: new BigNumber(1_000_000),
      recipient: RECIPIENT,
      expect: (prev, curr) => {
        const prevSub = prev.subAccounts?.find((s) => s.id === trc10SubAccountId);
        const currSub = curr.subAccounts?.find((s) => s.id === trc10SubAccountId);
        expect(currSub).toBeDefined();
        expect(prevSub).toBeDefined();
        expect(currSub!.operations.length).toBeGreaterThan(prevSub!.operations.length);
        expect(currSub!.operations[0].type).toBe("OUT");
        expect(currSub!.operations[0].recipients).toContain(RECIPIENT);
        // TRC-10 sub-account: amount is asset units; fee (in TRX) is charged
        // against the parent account, so the sub-account balance change is
        // exactly the amount sent.
        expect(currSub!.balance.toString()).toBe(
          prevSub!.balance.minus(currSub!.operations[0].value).toString(),
        );
      },
    },
    {
      name: "Send 1 TRC-20",
      subAccountId: trc20SubAccountId,
      amount: new BigNumber(1_000_000),
      recipient: RECIPIENT,
      expect: (prev, curr) => {
        const prevSub = prev.subAccounts?.find((s) => s.id === trc20SubAccountId);
        const currSub = curr.subAccounts?.find((s) => s.id === trc20SubAccountId);
        expect(currSub).toBeDefined();
        expect(prevSub).toBeDefined();
        expect(currSub!.operations.length).toBeGreaterThan(prevSub!.operations.length);
        expect(currSub!.operations[0].type).toBe("OUT");
        expect(currSub!.operations[0].recipients).toContain(RECIPIENT);
      },
    },
    {
      name: "Send max TRC-10",
      subAccountId: trc10SubAccountId,
      useAllAmount: true,
      recipient: RECIPIENT,
      expect: (_prev, curr) => {
        const sub = curr.subAccounts?.find((s) => s.id === trc10SubAccountId);
        expect(sub).toBeDefined();
        expect(sub!.spendableBalance.toString()).toBe("0");
      },
    },
    {
      name: "Send max TRC-20",
      subAccountId: trc20SubAccountId,
      useAllAmount: true,
      recipient: RECIPIENT,
      expect: (_prev, curr) => {
        const sub = curr.subAccounts?.find((s) => s.id === trc20SubAccountId);
        expect(sub).toBeDefined();
        expect(sub!.spendableBalance.toString()).toBe("0");
      },
    },
    {
      name: "Send max TRX",
      useAllAmount: true,
      recipient: RECIPIENT,
      expect: (_prev, curr) => {
        const [latest] = curr.operations;
        expect(latest.type).toBe("OUT");
        expect(curr.spendableBalance.toString()).toBe("0");
      },
    },
  ];
}

export const scenarioTron: Scenario<Transaction, TronAccount> = {
  name: "Tron Deterministic Tester",
  setup: async (_strategy) => {
    await spawnNode();
    const signer = buildTronSigner(SENDER_MNEMONIC);
    const { address, publicKey } = await signer.getAddress(TRON_DERIVATION_PATH);

    // 1. Fund the test account with TRX from the witness.
    await fundAccount(address, INITIAL_FUNDING_SUN);

    // 2. Issue TRC-10 + deploy TRC-20, seed initial balances on the test account.
    trc10Fixture = await deployTrc10(address);
    trc20Fixture = await deployTrc20(address);

    // 3. Register both tokens in the CAL mock store so coin-tron's sync surfaces them.
    registerTokensInMockStore();

    // 4. Start MSW. The indexer routes TronGrid calls to the local node and
    //    queries deployed TRC-20 contracts for balanceOf via constant calls.
    closeMsw = initMswHandlers(address, [trc20Fixture.contractAddress]);

    // 5. Build bridges. coin-tron's createBridges captures the coinConfig getter,
    //    pointing the explorer URL at the MSW-intercepted host.
    const { accountBridge, currencyBridge } = getBridges(signer);
    const account = makeAccount(address, publicKey) as TronAccount;
    return { accountBridge, currencyBridge, account };
  },
  /**
   * Called by the coin-tester engine immediately after each broadcast, before
   * the post-broadcast sync. Waiting here for the broadcast tx to land in a
   * block means the first sync attempt already sees the new operation —
   * eliminating the "Test assertion failed. Retrying..." retry loop.
   */
  mockIndexer: async (_account, optimisticOperation) => {
    await waitForTxConfirmation(optimisticOperation.hash);
  },
  beforeAll: async (account) => {
    // After the engine's initial sync, sub-accounts exist on the parent account.
    // Capture their ids — the scenario transactions reference them.
    const trc10Id = trc10Fixture?.calTokenId;
    const trc20Id = trc20Fixture?.calTokenId;
    const trc10Sub = account.subAccounts?.find((s) => s.token.id === trc10Id);
    const trc20Sub = account.subAccounts?.find((s) => s.token.id === trc20Id);
    if (!trc10Sub || !trc20Sub) {
      throw new Error(
        `beforeAll: expected sub-accounts for ${trc10Id} and ${trc20Id} after initial sync, ` +
          `got [${account.subAccounts?.map((s) => s.token.id).join(", ")}]`,
      );
    }
    trc10SubAccountId = trc10Sub.id;
    trc20SubAccountId = trc20Sub.id;
  },
  getTransactions: () => getTronTransactions(),
  teardown: async () => {
    closeMsw?.();
    resetIndexer();
    trc10Fixture = null;
    trc20Fixture = null;
    trc10SubAccountId = "";
    trc20SubAccountId = "";
    await killNode();
  },
};
