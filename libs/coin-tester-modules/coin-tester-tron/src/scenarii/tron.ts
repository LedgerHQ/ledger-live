import BigNumber from "bignumber.js";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Transaction, TronAccount } from "@ledgerhq/coin-tron/types/index";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import {
  TRON,
  TRON_LOCAL_RPC,
  makeTronAccount,
  makeTrc10Token,
  makeTrc20Token,
  registerTronTokensInMockStore,
} from "../fixtures";
import { getLegacyBridges } from "../helpers";
import { getPrefundedAccounts, killTronbox, spawnTronbox } from "../tronbox";
import type { PrefundedAccount } from "../tronbox";
import {
  indexBlocks,
  initMswHandlers,
  registerTrc20Contract,
  resetIndexer,
  waitForOperationInclusion,
} from "../indexer";
import { deployTrc20, issueTrc10 } from "../tokenFixtures";
import type { Trc10Asset, Trc20Asset } from "../tokenFixtures";

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

type Tx = ScenarioTransaction<Transaction, TronAccount>;

const baseTx = {
  family: "tron" as const,
  mode: "send" as const,
  resource: null,
  networkInfo: null,
  duration: 3,
  votes: [],
};

function makeTransactions(): Tx[] {
  const sendTrx: Tx = {
    ...baseTx,
    name: "Send 10 TRX",
    amount: new BigNumber(10_000_000),
    recipient: recipient.address,
    useAllAmount: false,
    expect: (_prev, curr) => {
      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipient.address);
      expect(latestOp.fee).toStrictEqual(new BigNumber(0));
      expect(latestOp.value).toStrictEqual(latestOp.fee.plus(10_000_000));
    },
  };

  const sendTrc10: Tx = {
    ...baseTx,
    name: `Send 100 ${trc10.symbol} (TRC10)`,
    amount: new BigNumber(100),
    recipient: recipient.address,
    subAccountId: trc10SubAccountId,
    useAllAmount: false,
    expect: (prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc10SubAccountId);
      const prevSub = prev.subAccounts?.find(s => s.id === trc10SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance).toStrictEqual((prevSub?.balance ?? new BigNumber(0)).minus(100));
      const [latestOp] = sub!.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipient.address);
      expect(latestOp.fee).toStrictEqual(new BigNumber(0));
    },
  };

  const sendMaxTrc10: Tx = {
    ...baseTx,
    name: `Send max ${trc10.symbol} (TRC10)`,
    amount: new BigNumber(0),
    recipient: recipient.address,
    subAccountId: trc10SubAccountId,
    useAllAmount: true,
    expect: (_prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc10SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance).toStrictEqual(new BigNumber(0));
    },
  };

  const sendTrc20: Tx = {
    ...baseTx,
    name: `Send 1 ${trc20.symbol} (TRC20)`,
    amount: new BigNumber(1_000_000),
    recipient: recipient.address,
    subAccountId: trc20SubAccountId,
    useAllAmount: false,
    expect: (prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc20SubAccountId);
      const prevSub = prev.subAccounts?.find(s => s.id === trc20SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance).toStrictEqual((prevSub?.balance ?? new BigNumber(0)).minus(1_000_000));
      const [latestOp] = sub!.operations;
      expect(latestOp.type).toBe("OUT");
      expect(latestOp.recipients).toContain(recipient.address);
      expect(latestOp.fee.gt(0)).toBe(true);
    },
  };

  const sendMaxTrc20: Tx = {
    ...baseTx,
    name: `Send max ${trc20.symbol} (TRC20)`,
    amount: new BigNumber(0),
    recipient: recipient.address,
    subAccountId: trc20SubAccountId,
    useAllAmount: true,
    expect: (_prev, curr) => {
      const sub = curr.subAccounts?.find(s => s.id === trc20SubAccountId);
      expect(sub).toBeDefined();
      expect(sub!.balance).toStrictEqual(new BigNumber(0));
    },
  };

  const sendMaxTrx: Tx = {
    ...baseTx,
    name: "Send max TRX",
    amount: new BigNumber(0),
    recipient: recipient.address,
    useAllAmount: true,
    expect: (_prev, curr) => {
      const [latestOp] = curr.operations;
      expect(latestOp.type).toBe("OUT");
      // useAllAmount keeps the fallback estimateFees worst case in reserve
      // (ACTIVATION_FEES = 1.1 TRX). Allow some headroom around that.
      expect(curr.spendableBalance.lt(2_000_000)).toBe(true);
    },
  };

  // TRC20 send burns energy (= TRX), so sendMax TRX must run last;
  // otherwise the funder no longer has enough TRX to cover TRC20 fees.
  return [sendTrx, sendTrc10, sendMaxTrc10, sendTrc20, sendMaxTrc20, sendMaxTrx];
}

export const scenarioTron: Scenario<Transaction, TronAccount> = {
  name: "Ledger Live Basic Tron Transactions (TRX + TRC10 + TRC20)",

  setup: async () => {
    await spawnTronbox();

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

    trc10Token = makeTrc10Token(trc10);
    trc20Token = makeTrc20Token(trc20);
    registerTronTokensInMockStore(trc10Token, trc20Token);

    const headRes = await fetch(`${TRON_LOCAL_RPC}/wallet/getnowblock`);
    const head = (await headRes.json()) as { block_header: { raw_data: { number: number } } };
    startBlock = head.block_header.raw_data.number;

    closeMsw = initMswHandlers();

    const { currencyBridge, accountBridge } = await getLegacyBridges(funder.signer);
    const account = makeTronAccount(funder.address) as unknown as TronAccount;
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
    await killTronbox();
  },
};
