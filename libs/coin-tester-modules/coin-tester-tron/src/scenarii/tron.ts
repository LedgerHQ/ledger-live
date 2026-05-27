import BigNumber from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import tronCoinConfig from "@ledgerhq/coin-tron/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { TRON, TRON_LOCAL_RPC, makeTronAccount } from "../fixtures";
import { getDualBridges } from "../helpers";
import {
  getPrefundedAccounts,
  killTronQuickstart,
  spawnTronQuickstart,
  type PrefundedAccount,
} from "../tronQuickstart";
import {
  indexBlocks,
  initMswHandlers,
  registerTrc20Contract,
  resetIndexer,
  waitForOperationInclusion,
} from "../indexer";
import { deployTrc20, issueTrc10, type Trc10Asset, type Trc20Asset } from "../tokenFixtures";

let closeMsw: (() => void) | null = null;
let funder: PrefundedAccount;
let recipient: PrefundedAccount;
let startBlock = 0;
let trc10: Trc10Asset;
let trc10Token: TokenCurrency;
let trc10SubAccountId = "";
let trc20: Trc20Asset;
let trc20Token: TokenCurrency;
let trc20SubAccountId = "";

type Tx = ScenarioTransaction<GenericTransaction, Account>;

function makeTransactions(): Tx[] {
  const sendTrx: Tx = {
    name: "Send 10 TRX",
    mode: "send",
    amount: new BigNumber(10_000_000),
    recipient: recipient.address,
    expect: (prev, curr) => {
      expect(curr.operations.length).toBeGreaterThan(prev.operations.length);
      const outOp = curr.operations.find(o => o.type === "OUT");
      expect(outOp).toBeDefined();
      expect(outOp!.recipients).toContain(recipient.address);
      expect(outOp!.fee.toNumber()).toBe(0);
      expect(outOp!.value.toString()).toBe(outOp!.fee.plus(10_000_000).toString());
    },
  };

  const sendTrc10: Tx = {
    name: `Send 100 ${trc10.symbol} (TRC10)`,
    mode: "send",
    amount: new BigNumber(100),
    recipient: recipient.address,
    subAccountId: trc10SubAccountId,
    expect: (prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc10SubAccountId);
      const prevSub = prev.subAccounts?.find(s => s.id === trc10SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance.toString()).toBe(
        (prevSub?.balance ?? new BigNumber(0)).minus(100).toString(),
      );
      const outOp = sub!.operations.find(o => o.type === "OUT");
      expect(outOp).toBeDefined();
      expect(outOp!.recipients).toContain(recipient.address);
      expect(outOp!.fee.toNumber()).toBe(0);
    },
  };

  const sendMaxTrc10: Tx = {
    name: `Send max ${trc10.symbol} (TRC10)`,
    mode: "send",
    useAllAmount: true,
    recipient: recipient.address,
    subAccountId: trc10SubAccountId,
    expect: (_prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc10SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance.toNumber()).toBe(0);
    },
  };

  const sendTrc20: Tx = {
    name: `Send 1 ${trc20.symbol} (TRC20)`,
    mode: "send",
    amount: new BigNumber(1_000_000),
    recipient: recipient.address,
    subAccountId: trc20SubAccountId,
    expect: (prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc20SubAccountId);
      const prevSub = prev.subAccounts?.find(s => s.id === trc20SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance.toString()).toBe(
        (prevSub?.balance ?? new BigNumber(0)).minus(1_000_000).toString(),
      );
      const outOp = sub!.operations.find(o => o.type === "OUT");
      expect(outOp).toBeDefined();
      expect(outOp!.recipients).toContain(recipient.address);
      expect(outOp!.fee.toNumber()).toBeGreaterThan(0);
    },
  };

  const sendMaxTrc20: Tx = {
    name: `Send max ${trc20.symbol} (TRC20)`,
    mode: "send",
    useAllAmount: true,
    recipient: recipient.address,
    subAccountId: trc20SubAccountId,
    expect: (_prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc20SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance.toNumber()).toBe(0);
    },
  };

  const sendMaxTrx: Tx = {
    name: "Send max TRX",
    mode: "send",
    useAllAmount: true,
    recipient: recipient.address,
    expect: (prev, curr) => {
      const outOps = curr.operations.filter(o => o.type === "OUT");
      const prevOuts = prev.operations.filter(o => o.type === "OUT");
      expect(outOps.length).toBeGreaterThan(prevOuts.length);
      // useAllAmount keeps the fallback estimateFees worst case in reserve
      // (ACTIVATION_FEES = 1.1 TRX). Allow some headroom around that.
      expect(curr.spendableBalance.toNumber()).toBeLessThan(2_000_000);
    },
  };

  // TRC20 send burns energy (= TRX), so sendMax TRX must run last;
  // otherwise the funder no longer has enough TRX to cover TRC20 fees.
  return [sendTrx, sendTrc10, sendMaxTrc10, sendTrc20, sendMaxTrc20, sendMaxTrx];
}

export const scenarioTron: Scenario<GenericTransaction, Account> = {
  name: "Ledger Live Tron — full suite (TRX + TRC10 + TRC20)",

  setup: async strategy => {
    await spawnTronQuickstart();

    const accounts = await getPrefundedAccounts();
    if (accounts.length < 2) {
      throw new Error("tronbox/tre must expose at least 2 prefunded accounts");
    }
    funder = accounts[0];
    recipient = accounts[1];

    trc10 = await issueTrc10(funder, {
      name: "LedgerTestToken",
      abbr: "LTT",
      totalSupply: 1_000_000_000,
      precision: 0,
    });
    trc20 = await deployTrc20(funder, {
      name: "Tether USD",
      symbol: "USDT",
      decimals: 6,
      initialSupply: 1_000_000_000_000n,
    });
    registerTrc20Contract({
      contractAddress: trc20.contractAddress,
      name: trc20.name,
      symbol: trc20.symbol,
      decimals: trc20.decimals,
    });

    trc10Token = {
      type: "TokenCurrency",
      id: `tron/trc10/${trc10.assetId}`,
      contractAddress: trc10.assetId,
      parentCurrency: TRON,
      tokenType: "trc10",
      name: trc10.name,
      ticker: trc10.symbol,
      delisted: false,
      disableCountervalue: false,
      units: [{ name: trc10.symbol, code: trc10.symbol, magnitude: trc10.decimals }],
      ledgerSignature: "",
    } as TokenCurrency;

    trc20Token = {
      type: "TokenCurrency",
      id: `tron/trc20/${trc20.contractAddress.toLowerCase()}`,
      contractAddress: trc20.contractAddress,
      parentCurrency: TRON,
      tokenType: "trc20",
      name: trc20.name,
      ticker: trc20.symbol,
      delisted: false,
      disableCountervalue: false,
      units: [{ name: trc20.symbol, code: trc20.symbol, magnitude: trc20.decimals }],
    } as TokenCurrency;

    setupMockCryptoAssetsStore({
      findTokenById: async (id: string) =>
        id === trc10Token.id ? trc10Token : id === trc20Token.id ? trc20Token : undefined,
      findTokenByAddressInCurrency: async (address: string, currencyId: string) => {
        if (currencyId !== "tron") return undefined;
        if (address === trc10Token.contractAddress) return trc10Token;
        if (address === trc20Token.contractAddress) return trc20Token;
        return undefined;
      },
    });

    const localConfig = {
      status: { type: "active" as const },
      explorer: { url: TRON_LOCAL_RPC },
    };
    tronCoinConfig.setCoinConfig(() => localConfig);
    LiveConfig.setConfig({
      config_currency_tron: { type: "object", default: localConfig },
    });

    const headRes = await fetch(`${TRON_LOCAL_RPC}/wallet/getnowblock`);
    const head = (await headRes.json()) as { block_header: { raw_data: { number: number } } };
    startBlock = head.block_header.raw_data.number;

    closeMsw = initMswHandlers();

    const { currencyBridge, accountBridge } = await getDualBridges(strategy, funder.signer);
    const account = makeTronAccount(funder.address);
    trc10SubAccountId = encodeTokenAccountId(account.id, trc10Token);
    trc20SubAccountId = encodeTokenAccountId(account.id, trc20Token);
    return { currencyBridge, accountBridge, account, retryInterval: 4000, retryLimit: 30 };
  },

  getTransactions: () => makeTransactions(),

  beforeSync: async () => {
    if (funder) await indexBlocks([funder.address, recipient.address], startBlock);
  },

  mockIndexer: async (_account, optimistic) => {
    await waitForOperationInclusion(optimistic.hash);
  },

  beforeAll: account => {
    expect(account.currency.id).toBe(TRON.id);
    expect(account.balance.toNumber()).toBeGreaterThanOrEqual(1_000_000_000);
    const subTrc10 = account.subAccounts?.find(s => s.id === trc10SubAccountId);
    expect(subTrc10).toBeDefined();
    expect(subTrc10!.balance.toNumber()).toBe(1_000_000_000);
    const subTrc20 = account.subAccounts?.find(s => s.id === trc20SubAccountId);
    expect(subTrc20).toBeDefined();
    expect(subTrc20!.balance.toNumber()).toBeGreaterThan(0);
  },

  teardown: async () => {
    closeMsw?.();
    closeMsw = null;
    resetIndexer();
    await killTronQuickstart();
  },
};
