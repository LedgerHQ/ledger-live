// PROTOTYPE-STAND-IN: measurement harness for the nearblocks call-count POC, not a product test.
// It syncs real NEAR accounts through the local counting proxy (count-proxy.mjs, never Ledger's
// hosts) on the legacy and the generic bridge, and writes the calls per scenario to NEAR_POC_OUT.
//
//   NEAR_POC_OUT=<dir> [NEAR_POC_PHASE=main|restart] [NEAR_POC_BRIDGES=legacy,generic] \
//   ONLY_INTEGRATION_TESTS=true pnpm jest src/families/near/near-sync-count
import "../../__tests__/test-helpers/setup.integration";
import fs from "fs";
import path from "path";
import BigNumber from "bignumber.js";
import { firstValueFrom } from "rxjs";
import { reduce } from "rxjs/operators";
import type { Account } from "@ledgerhq/types-live";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { nearDefaults } from "@ledgerhq/coin-near/config";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountBridge, getCurrencyBridge, clearBridgeCache } from "../../bridge";
import { emptyHistoryCache, toAccountRaw, fromAccountRaw } from "../../account";

const PROXY = process.env.NEAR_POC_PROXY ?? "http://localhost:8787";
const OUT = process.env.NEAR_POC_OUT ?? path.join(process.cwd(), "near-poc-out");
const PHASE = process.env.NEAR_POC_PHASE ?? "main";
const BRIDGES = (process.env.NEAR_POC_BRIDGES ?? "legacy,generic").split(",");
const ACCOUNTS = (
  process.env.NEAR_POC_ACCOUNTS ??
  [
    "451d35aad0ea6aa86fecb4bf8d04c74e77d56d01a571e56e3f51ad826b4fa3e8", // 2 pools
    "d279800e96701a323b847f96ed347755952895b2fd189b4584b3730f97682f1b", // 2 pools, busy
    "d6fc282be6e2ddbc6ad46103a0cff6529e8c603a5e0575c4369046d81893b496", // 1 pool
    "97dfd50106897042e2540bf48ff56e4008a75cfaf5058a4269c415db935f1c9d", // 1 pool, quiet
    "10a7162dea86c7ac0fe4331941adda89050f592f5c2d0f9efe8bede5b7f8321f", // history parity sample
    "18d68decb70d4d4fd267d19a0d25edc06ad079e69ded41233a10976cf36391ec", // bridge dataset account
    "6b69fc2a00355d94bbad4d1e2fd2ed04bbe0d29ae8e98302bcb466de901f16d7", // no staking
  ].join(",")
).split(",");

const currency = getCryptoCurrencyById("near");

const control = async (p: string) => (await fetch(`${PROXY}${p}`, { method: "POST" })).json();
const stats = async () => (await (await fetch(`${PROXY}/__stats`)).json()).counts;

const useBridge = (bridge: string) => {
  LiveConfig.setOverride("config_currency_near", {
    ...nearDefaults.near,
    infra: {
      API_NEAR_PRIVATE_NODE: `${PROXY}/node`,
      API_NEAR_PUBLIC_NODE: `${PROXY}/node`,
      API_NEAR_INDEXER: `${PROXY}/legacy-indexer`,
      API_NEARBLOCKS_INDEXER: `${PROXY}/nb`,
    },
  });
  LiveConfig.setOverride("config_near_generic_bridge", bridge === "generic");
  clearBridgeCache("near");
};

const blankAccount = (address: string): Account => ({
  type: "Account",
  id: `js:2:near:${address}:nearbip44h`,
  seedIdentifier: address,
  xpub: address,
  used: true,
  swapHistory: [],
  derivationMode: "nearbip44h" as Account["derivationMode"],
  currency,
  index: 0,
  freshAddress: address,
  freshAddressPath: "44'/397'/0'/0'/0'",
  creationDate: new Date(),
  lastSyncDate: new Date(0),
  blockHeight: 0,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  balanceHistoryCache: emptyHistoryCache,
});

type Outcome = {
  ok: boolean;
  error?: string;
  balance?: string;
  spendable?: string;
  stakingPositions?: number;
  operations?: number;
  account?: Account;
};

const sync = async (account: Account): Promise<Outcome> => {
  try {
    const bridge = await getAccountBridge(account);
    const synced = await firstValueFrom(
      bridge
        .sync(account, { paginationConfig: {}, blacklistedTokenIds: [] })
        .pipe(reduce((a: Account, f: (a: Account) => Account) => f(a), account)),
    );
    const res = (synced as Account & { nearResources?: { stakingPositions?: unknown[] } })
      .nearResources;
    return {
      ok: true,
      balance: synced.balance.toFixed(),
      spendable: synced.spendableBalance.toFixed(),
      stakingPositions: res?.stakingPositions?.length,
      operations: synced.operations.length,
      account: synced,
    };
  } catch (e) {
    return {
      ok: false,
      error: String((e as Error)?.name ?? e) + ": " + String((e as Error)?.message ?? ""),
    };
  }
};

const preload = async () => {
  const cb = await getCurrencyBridge(currency);
  try {
    const data = await cb.preload?.(currency);
    cb.hydrate?.(data, currency);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
};

const write = (bridge: string, scenario: string, payload: unknown) => {
  const dir = path.join(OUT, bridge);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${scenario}.json`), JSON.stringify(payload, null, 2));
};

// One scenario = reset the proxy counts, set the fault mode, run, store calls + outcomes.
const scenario = async (
  bridge: string,
  name: string,
  mode: string,
  run: () => Promise<Record<string, unknown>>,
) => {
  await control(`/__mode?${mode}`);
  await control("/__reset");
  const outcomes = await run();
  write(bridge, name, { mode, calls: await stats(), outcomes });
  await control("/__mode?nb=pass");
};

const strip = (o: Outcome) => ({ ...o, account: undefined });

describe("nearblocks call count", () => {
  for (const bridge of BRIDGES) {
    test(
      `${PHASE} ${bridge}`,
      async () => {
        useBridge(bridge);
        const savedFile = path.join(OUT, bridge, "S1-accounts.json");

        if (PHASE === "restart" || PHASE === "restart-429") {
          // A fresh process (empty in-memory caches) syncing accounts already known; with
          // restart-429, nearblocks is rate-limited from the app start.
          const raws = JSON.parse(fs.readFileSync(savedFile, "utf8"));
          const known: Account[] = await Promise.all(raws.map(fromAccountRaw));
          const [coldName, coldMode] =
            PHASE === "restart"
              ? ["S4-restart", "nb=pass"]
              : ["S14-restart-nearblocks-429", "nb=429"];
          await scenario(bridge, coldName, coldMode, async () => {
            const p = await preload();
            const r: Record<string, unknown> = { preload: p };
            for (const a of known) r[a.freshAddress] = strip(await sync(a));
            return r;
          });
          return;
        }
        fs.mkdirSync(path.join(OUT, bridge), { recursive: true });

        await scenario(bridge, "S0-preload", "nb=pass", async () => ({ preload: await preload() }));

        const first: Record<string, Account> = {};
        await scenario(bridge, "S1-first-sync", "nb=pass", async () => {
          const r: Record<string, unknown> = {};
          for (const addr of ACCOUNTS) {
            const o = await sync(blankAccount(addr));
            if (o.account) first[addr] = o.account;
            r[addr] = strip(o);
          }
          return r;
        });
        fs.writeFileSync(
          savedFile,
          JSON.stringify(await Promise.all(Object.values(first).map(a => toAccountRaw(a)))),
        );

        const known = () => Object.values(first);
        const fromKnown = async () => {
          const r: Record<string, unknown> = {};
          for (const a of known()) r[a.freshAddress] = strip(await sync(a));
          return r;
        };

        await scenario(bridge, "S2-steady-no-change", "nb=pass", fromKnown);
        // The account as it was one transaction ago. A real new transaction also changes the node
        // account state, so the stored state markers (legacy fingerprint, generic spendable balance)
        // no longer match.
        const oneTxAgo = (a: Account): Account => {
          const ops = a.operations.slice(1);
          const res = (a as Account & { nearResources?: Record<string, unknown> }).nearResources;
          return {
            ...a,
            operations: ops,
            operationsCount: ops.length,
            spendableBalance: a.spendableBalance.plus(1),
            ...(res && { nearResources: { ...res, accountStateFingerprint: "before-new-tx" } }),
          } as Account;
        };
        const fromOneTxAgo = async () => {
          const r: Record<string, unknown> = {};
          for (const a of known()) {
            const o = await sync(oneTxAgo(a));
            r[a.freshAddress] = {
              ...strip(o),
              expectedOperations: a.operations.length,
              expectedBalance: a.balance.toFixed(),
            };
          }
          return r;
        };
        await scenario(bridge, "S3-steady-one-new-tx", "nb=pass", fromOneTxAgo);
        // Nearblocks fails while there is something new to read: the fallbacks must keep the
        // balance and staking from the node and the stored operations.
        await scenario(bridge, "S10-new-tx-nearblocks-429", "nb=429", fromOneTxAgo);
        await scenario(bridge, "S11-new-tx-nearblocks-503", "nb=503", fromOneTxAgo);
        await scenario(
          bridge,
          "S12-new-tx-staking-deposits-down",
          "fail=staking-deposits",
          fromOneTxAgo,
        );
        await scenario(bridge, "S13-new-tx-history-down", "fail=/txns", fromOneTxAgo);
        // The newest transaction staked to a pool the stored account does not hold yet (as if it was
        // sent from another wallet): the sync must find that pool and its position.
        await scenario(bridge, "S14-new-stake-unknown-pool", "nb=pass", async () => {
          const r: Record<string, unknown> = {};
          for (const a of known()) {
            const newest = a.operations[0];
            const pool = newest?.type === "STAKE" ? newest.recipients[0] : undefined;
            if (!pool) continue;
            const older = oneTxAgo(a) as Account & {
              nearResources?: { stakingPositions: { validatorId: string }[] };
              stakingPositions?: { delegate?: string }[];
            };
            if (older.nearResources) {
              older.nearResources = {
                ...older.nearResources,
                stakingPositions: older.nearResources.stakingPositions.filter(
                  p => p.validatorId !== pool,
                ),
              };
            }
            if (older.stakingPositions) {
              older.stakingPositions = older.stakingPositions.filter(p => p.delegate !== pool);
            }
            const o = await sync(older);
            const found = o.account
              ? JSON.stringify(
                  (o.account as Account & { nearResources?: unknown; stakingPositions?: unknown })
                    .nearResources ??
                    (o.account as { stakingPositions?: unknown }).stakingPositions,
                ).includes(pool)
              : false;
            r[a.freshAddress] = {
              ...strip(o),
              pool,
              poolFound: found,
              expectedBalance: a.balance.toFixed(),
            };
          }
          return r;
        });
        await scenario(bridge, "S5-nearblocks-429", "nb=429", fromKnown);
        await scenario(bridge, "S6-nearblocks-503", "nb=503", fromKnown);
        await scenario(bridge, "S7-staking-deposits-down", "fail=staking-deposits", fromKnown);
        await scenario(bridge, "S8-history-down", "fail=/txns", fromKnown);
        await scenario(bridge, "S9-preload-nearblocks-429", "nb=429", async () => ({
          preload: await preload(),
        }));
      },
      3 * 60 * 60 * 1000,
    );
  }
});
