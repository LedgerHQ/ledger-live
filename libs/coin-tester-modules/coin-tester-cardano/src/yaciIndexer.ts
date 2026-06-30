// MSW handler set that serves coin-cardano's Strica `/v1/*` API from a live Yaci devnet, translating
// each response via the pure reshapers in yaciAdapter.ts. Covers the send path (block, params,
// transaction list, delegation read, submit) + a synthesized pool. Staking *signing* is out of scope
// here — delegate/undelegate stay on the in-memory mock (indexer.ts) until multi-witness lands.
import {
  extractPaymentKeyFromAddress,
  extractStakeKeyFromAddress,
} from "@ledgerhq/coin-cardano/utils";
import { address as TyphonAddress, types as TyphonTypes } from "@stricahq/typhonjs";
import { Buffer } from "buffer";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { MOCK_API } from "./fixtures";
import { EPOCH_PARAMS, POOL_DETAIL, POOL_LIST_PAGE } from "./fixtures/ledgerPools";
import { YACI_STORE_API } from "./yaci";
import {
  toApiDelegation,
  toApiTransaction,
  toLatestBlock,
  toProtocolParams,
  type YaciAccount,
  type YaciBlock,
  type YaciMetadatum,
  type YaciParams,
  type YaciTxMeta,
  type YaciTxUtxos,
} from "./yaciAdapter";

const PAGE_LIMIT = 100;

// paymentKey hex → bech32 address, and stake-key hex → reward (stake) bech32 — the tester owns funding,
// so it registers each funded address and the adapter resolves Strica's key-hash queries to the
// bech32 forms Yaci queries by.
const addressByPaymentKey = new Map<string, string>();
const stakeAddressByStakeKey = new Map<string, string>();

/** Record a funded address so /v1/transaction (by paymentKey) and /v1/delegation (by stakeKey) resolve. */
export function registerAddress(address: string, networkId: number): void {
  addressByPaymentKey.set(extractPaymentKeyFromAddress(address), address);
  const stakeKey = extractStakeKeyFromAddress(address);
  if (stakeKey) {
    const reward = new TyphonAddress.RewardAddress(networkId, {
      hash: Buffer.from(stakeKey, "hex"),
      type: TyphonTypes.HashType.ADDRESS,
    });
    stakeAddressByStakeKey.set(stakeKey, reward.getBech32());
  }
}

export function resetRegisteredAddresses(): void {
  addressByPaymentKey.clear();
  stakeAddressByStakeKey.clear();
}

async function yaciGet<T>(path: string): Promise<T | null> {
  const res = await fetch(`${YACI_STORE_API}${path}`);
  if (!res.ok) return null;
  return (await res.json()) as T;
}

// A Yaci tx (Blockfrost-compatible /txs/{hash}) carries inputs/outputs + fees + block info in one call.
type YaciTx = YaciTxUtxos & { fees?: string; block_height: number; block_time?: number };

async function transactionsForAddress(
  address: string,
): Promise<ReturnType<typeof toApiTransaction>[]> {
  const metas = (await yaciGet<YaciTxMeta[]>(`/addresses/${address}/transactions`)) ?? [];
  const out = [];
  for (const meta of metas) {
    const tx = await yaciGet<YaciTx>(`/txs/${meta.tx_hash}`);
    if (!tx) continue;
    const metadata = (await yaciGet<YaciMetadatum[]>(`/txs/${meta.tx_hash}/metadata`)) ?? undefined;
    out.push(
      toApiTransaction(tx, { ...meta, block_height: tx.block_height }, tx.fees ?? "0", metadata),
    );
  }
  return out;
}

export function initYaciIndexer(): () => void {
  const server = setupServer(
    http.get(`${MOCK_API}/v1/block/latest`, async () => {
      const block = (await yaciGet<YaciBlock>("/blocks/latest")) ?? { height: 0 };
      return HttpResponse.json(toLatestBlock(block));
    }),

    http.get(`${MOCK_API}/v1/network/info`, async () => {
      const params = await yaciGet<YaciParams>("/epochs/latest/parameters");
      if (!params) return HttpResponse.json({ error: "no params" }, { status: 502 });
      return HttpResponse.json({ protocolParams: toProtocolParams(params) });
    }),

    http.post(`${MOCK_API}/v1/transaction`, async ({ request }) => {
      const body = (await request.json()) as { paymentKeys: string[]; pageNo: number };
      if (body.pageNo > 1) return HttpResponse.json({ transactions: [], limit: PAGE_LIMIT });
      const addresses = [
        ...new Set(body.paymentKeys.map(pk => addressByPaymentKey.get(pk)).filter(Boolean)),
      ];
      const transactions = (
        await Promise.all((addresses as string[]).map(transactionsForAddress))
      ).flat();
      return HttpResponse.json({ transactions, limit: PAGE_LIMIT });
    }),

    http.get(`${MOCK_API}/v1/delegation`, async ({ request }) => {
      const stakeKey = new URL(request.url).searchParams.get("stakeKey") ?? "";
      const stakeAddress = stakeAddressByStakeKey.get(stakeKey);
      if (!stakeAddress) return HttpResponse.json({ delegation: null });
      const account = await yaciGet<YaciAccount>(`/accounts/${stakeAddress}`);
      const params = await yaciGet<YaciParams>("/epochs/latest/parameters");
      const keyDeposit = params ? String(params.key_deposit) : "2000000";
      return HttpResponse.json({ delegation: toApiDelegation(account, stakeKey, keyDeposit) });
    }),

    http.post(`${MOCK_API}/v1/transaction/submit`, async ({ request }) => {
      const { transaction } = (await request.json()) as { transaction: string };
      const res = await fetch(`${YACI_STORE_API}/tx/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/cbor" },
        body: Buffer.from(transaction, "hex"),
      });
      if (!res.ok) {
        return HttpResponse.json({ error: await res.text() }, { status: res.status });
      }
      // Blockfrost /tx/submit returns the tx hash as a (possibly quoted) string.
      const hash = (await res.text()).trim().replace(/^"|"$/g, "");
      return HttpResponse.json({ transaction: { hash } });
    }),

    // getValidators path: Yaci has no pool-list endpoint, so serve captured Ledger-proxy fixtures
    // (hermetic, real-shaped). Page 1 has the pools; later pages are empty so getValidators terminates.
    http.get(`${MOCK_API}/v1/pool/list`, ({ request }) => {
      const pageNo = Number(new URL(request.url).searchParams.get("pageNo") ?? "1");
      return HttpResponse.json(
        pageNo === 1 ? POOL_LIST_PAGE : { ...POOL_LIST_PAGE, pageNo, pools: [] },
      );
    }),
    http.get(`${MOCK_API}/v1/pool/detail`, () => HttpResponse.json(POOL_DETAIL)),
    // Epoch params for getValidators' APY (env.setup points CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT here).
    http.get(`${MOCK_API}/epoch-params`, () => HttpResponse.json(EPOCH_PARAMS)),
  );

  // Let the adapter's own fetches to the Yaci devnet (8080) and admin API (10000) through; anything
  // else unhandled is a real gap we want to see, not silently pass.
  server.listen({
    onUnhandledRequest: request => {
      const { hostname, port } = new URL(request.url);
      if (hostname === "localhost" && (port === "8080" || port === "10000")) return;
      throw new Error(`Unhandled request: ${request.method} ${request.url}`);
    },
  });
  return () => server.close();
}
