import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import test, { afterEach, beforeEach } from "node:test";
import {
  expectRentOrderedFromFake,
  startFakeTronify,
  TRONIFY_E2E_PAYEES,
  type FakeTronify,
} from "./fakeServer";
import { base58ToHex, encodeRentPaymentRawData, tronTxId } from "./txA";

const PAYER = "TGZWHs5PSSkg5o1jEqBEGoVmKByKqko7NM";
const UNKNOWN_ACCOUNT = "TYVnihygBiy6ZY4vYNzAcK9yMvAmYPhuVq";
// TronGrid answers this one with a body that isn't JSON.
const MALFORMED_ACCOUNT = "TMalformedAccount";
const USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const USDC = "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8";
// Not the fake's own 600, so a test can tell TronGrid's value from the fake's.
const UPSTREAM_FREE_NET = 1_500;

// What coin-tron sends for a 64285-energy, 10-minute rental.
const ORDER_REQUEST = {
  orderType: "ENERGY",
  tradeType: "fastTrade",
  fromAddress: PAYER,
  pledgeAddress: PAYER,
  pledgeNum: 64_285,
  pledgeDay: "0",
  pledgeHour: "0",
  pledgeMinute: "10",
  extraTrxNum: "0.8",
  sourceFlag: "ledger-live",
};

// Keys of the real queryPreorderInfo / addTronRentRecord responses captured on 2026-10-15.
const QUOTE_KEYS = [
  "fromAddress",
  "pledgeAddress",
  "pledgeDay",
  "pledgeHour",
  "pledgeMinute",
  "source",
  "orderType",
  "orderPrice",
  "pledgeNum",
  "pledgeTrxNum",
  "usdtModeAvailable",
  "payCoinCode",
  "payCoinAmt",
  "extraTrxNum",
  "pledgeBandwidthNum",
  "activeAccountFee",
  "purchaseTRXFee",
  "purchaseBandwidthFee",
  "purchaseEnergyFee",
  "transferTrxFee",
];
const ORDER_KEYS = [
  "orderId",
  "platformAddr",
  "fromAddress",
  "pledgeAddress",
  "pledgeDay",
  "pledgeHour",
  "pledgeMinute",
  "source",
  "orderType",
  "orderPrice",
  "pledgeNum",
  "pledgeBandwidthNum",
  "pledgeTrxNum",
  "transaction",
  "payCoinCode",
  "payCoinAmt",
  "extraTrxNum",
  "activeAccountFee",
  "purchaseTRXFee",
  "purchaseBandwidthFee",
  "purchaseEnergyFee",
];

type Envelope<T> = { resCode: number; resMsg: string; data: T };
type Payment = {
  txID: string;
  raw_data_hex: string;
  raw_data: {
    ref_block_bytes: string;
    ref_block_hash: string;
    expiration: number;
    timestamp: number;
    fee_limit: number;
    data?: string;
    contract: { parameter: { value: { owner_address: string } } }[];
  };
};
type Order = {
  orderId: string;
  platformAddr: string;
  payCoinAmt: string;
  pledgeNum: number;
  transaction: Payment;
};
type Quote = { payCoinCode: string; payCoinAmt: string; pledgeNum: number; fromAddress: string };
type PayOrders = { data: { orderId: string; orderStatus: string }[] };
type AccountResource = { EnergyLimit?: number; EnergyUsed?: number; freeNetLimit?: number };
type Accounts = { data: { address: string; balance?: number; trc20: Record<string, string>[] }[] };
type UpstreamCall = { method?: string; url?: string; body: unknown };

type Upstream = { url: string; calls: UpstreamCall[]; close(): Promise<void> };

// Stands in for TronGrid: one active account, a resource read, and an echo for everything else.
async function startUpstream(): Promise<Upstream> {
  const calls: UpstreamCall[] = [];
  const server = http.createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    calls.push({ method: req.method, url: req.url, body: raw ? JSON.parse(raw) : undefined });
    const { pathname, searchParams } = new URL(req.url ?? "/", "http://upstream");
    if (pathname === `/v1/accounts/${MALFORMED_ACCOUNT}`) {
      res.end("not json");
      return;
    }
    let payload: unknown = { upstream: true, method: req.method, url: req.url };
    if (pathname === `/v1/accounts/${PAYER}`) {
      payload = {
        data: [
          {
            address: base58ToHex(PAYER),
            balance: 5,
            trc20: [{ [USDC]: "7" }, { [USDT]: "999" }],
          },
        ],
        success: true,
        meta: { at: 1, page_size: 1 },
      };
    } else if (pathname === `/v1/accounts/${UNKNOWN_ACCOUNT}`) {
      payload = { data: [], success: true, meta: { at: 1, page_size: 0 } };
    } else if (pathname === "/wallet/getaccountresource") {
      const inactive = searchParams.get("address") === base58ToHex(UNKNOWN_ACCOUNT);
      payload = inactive
        ? {}
        : { freeNetLimit: UPSTREAM_FREE_NET, EnergyLimit: 999, EnergyUsed: 5 };
    }
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(payload));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    calls,
    close: () => new Promise(resolve => server.close(() => resolve())),
  };
}

let upstream: Upstream;
let fake: FakeTronify;

beforeEach(async () => {
  upstream = await startUpstream();
  fake = await startFakeTronify({
    port: 0,
    payees: TRONIFY_E2E_PAYEES,
    upstreamTronGrid: upstream.url,
    usdtBalance: 50_000_000n,
    trxBalanceSun: 20_000_000n,
  });
});

afterEach(async () => {
  await fake.close();
  await upstream.close();
});

const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const response = await fetch(`${fake.url}${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return response.json();
};
const post = <T>(path: string, body: unknown) => request<T>("POST", path, body);
const get = <T>(path: string) => request<T>("GET", path);

const quote = () => post<Envelope<Quote>>("/api/tronRent/queryPreorderInfo", ORDER_REQUEST);
const order = () => post<Envelope<Order>>("/api/tronRent/addTronRentRecord", ORDER_REQUEST);
const uploadHash = ({ orderId, transaction }: Order) =>
  post<Envelope<unknown>>("/api/tronRent/uploadHash", {
    orderId,
    fromHash: transaction.txID,
    signedData: { ...transaction, signature: ["00"] },
  });
const orderStatus = async ({ orderId }: Order) => {
  const { data } = await post<Envelope<PayOrders>>("/api/tronRent/mypayorder", {
    fromAddress: PAYER,
    orderType: "2",
    page: 1,
    pageSize: 50,
    sourceFlag: "ledger-live",
  });
  return data.data.find(entry => entry.orderId === orderId)?.orderStatus;
};
const energy = () =>
  get<AccountResource>(`/trongrid/wallet/getaccountresource?address=${base58ToHex(PAYER)}`);
const usdtOf = async (address: string) => {
  const { data } = await get<Accounts>(`/trongrid/v1/accounts/${address}`);
  return data[0].trc20.find(entry => USDT in entry)?.[USDT];
};

// The signed bytes carry exactly these values: the encoder is pinned to a real payment in txA.test.ts.
function assertPayment(
  { transaction }: Order,
  expected: { payee: string; amount: bigint; memo?: string },
) {
  const { raw_data: raw, raw_data_hex: rawDataHex } = transaction;
  const encoded = encodeRentPaymentRawData({
    ownerHex: base58ToHex(PAYER),
    payeeHex: base58ToHex(expected.payee),
    amountBaseUnits: expected.amount,
    refBlockBytes: raw.ref_block_bytes,
    refBlockHash: raw.ref_block_hash,
    expiration: raw.expiration,
    timestamp: raw.timestamp,
    feeLimit: raw.fee_limit,
    memo: expected.memo,
  });
  assert.equal(rawDataHex, encoded);
  assert.equal(transaction.txID, tronTxId(rawDataHex));
}

test("serves Tronify at the bound port and TronGrid under /trongrid", () => {
  assert.match(fake.url, /^http:\/\/127\.0\.0\.1:[1-9]\d*$/);
  assert.equal(fake.tronGridUrl, `${fake.url}/trongrid`);
});

test("quotes the rent in USDT with the keys of a real Tronify quote", async () => {
  const { resCode, data } = await quote();

  assert.equal(resCode, 100);
  assert.deepEqual(Object.keys(data).sort(), [...QUOTE_KEYS].sort());
  assert.equal(data.payCoinCode, "USDT");
  assert.equal(data.payCoinAmt, "3.169455");
  // Like the real quote: the asked energy plus what Tronify's own USDT payment burns.
  assert.equal(data.pledgeNum, 128_685);
  assert.equal(data.fromAddress, PAYER);
});

test("orders a TX-A from the requester to a listed payee for the quoted amount", async () => {
  const before = Date.now();
  const { resCode, data } = await order();

  assert.equal(resCode, 100);
  assert.deepEqual(Object.keys(data).sort(), [...ORDER_KEYS].sort());
  assert.equal(data.platformAddr, TRONIFY_E2E_PAYEES[0]);
  assert.equal(data.payCoinAmt, "3.169455");
  assertPayment(data, { payee: TRONIFY_E2E_PAYEES[0], amount: 3_169_455n });
  const raw = data.transaction.raw_data;
  assert.equal(raw.contract[0].parameter.value.owner_address, base58ToHex(PAYER));
  assert.ok(raw.expiration >= before + 6 * 60_000 && raw.expiration <= Date.now() + 6 * 60_000);
  assert.equal(raw.fee_limit, 100_000_000);
  // A fixed, months-stale block reference: never read from the chain.
  assert.deepEqual([raw.ref_block_bytes, raw.ref_block_hash], ["8ed0", "7280df3dd121c50c"]);
  assert.equal(upstream.calls.length, 0);
});

test("pays the listed payees in turn", async () => {
  const payees: string[] = [];
  for (let i = 0; i < 4; i++) payees.push((await order()).data.platformAddr);

  assert.deepEqual(payees, [...TRONIFY_E2E_PAYEES, TRONIFY_E2E_PAYEES[0]]);
});

test("badPayee pays a valid address outside the payee list", async () => {
  fake.setScenario("badPayee");
  const { data } = await order();

  assert.ok(!TRONIFY_E2E_PAYEES.includes(data.platformAddr));
  assertPayment(data, { payee: data.platformAddr, amount: 3_169_455n });
});

test("priceRose orders at 1.5 times the quote", async () => {
  fake.setScenario("priceRose");

  assert.equal((await quote()).data.payCoinAmt, "3.169455");
  const { data } = await order();
  assert.equal(data.payCoinAmt, "4.754183");
  assertPayment(data, { payee: TRONIFY_E2E_PAYEES[0], amount: 4_754_183n });
});

test("overCap quotes and orders above the 10 USDT rent cap", async () => {
  fake.setScenario("overCap");

  assert.equal((await quote()).data.payCoinAmt, "12");
  const { data } = await order();
  assert.equal(data.payCoinAmt, "12");
  assertPayment(data, { payee: TRONIFY_E2E_PAYEES[0], amount: 12_000_000n });
});

test("memo puts a memo on the TX-A", async () => {
  fake.setScenario("memo");
  const { data } = await order();
  const memo = data.transaction.raw_data.data;

  assert.ok(memo);
  assertPayment(data, {
    payee: TRONIFY_E2E_PAYEES[0],
    amount: 3_169_455n,
    memo: Buffer.from(memo, "hex").toString("utf8"),
  });
});

test("quoteError fails the quote", async () => {
  fake.setScenario("quoteError");
  const { resCode, resMsg } = await quote();

  assert.notEqual(resCode, 100);
  assert.ok(resMsg);
});

test("submitFailed refuses the signed payment and reports the order timed out", async () => {
  fake.setScenario("submitFailed");
  const { data } = await order();

  assert.notEqual((await uploadHash(data)).resCode, 100);
  // coin-tron reads "timeout" as failed, which live-common takes as a payment that never landed.
  assert.equal(await orderStatus(data), "timeout");
  assert.equal((await energy()).EnergyLimit, 0);
});

test("happy delivers the energy once the paid order has been polled", async () => {
  const { data } = await order();
  assert.equal(await orderStatus(data), "wait_deposit_send");
  assert.deepEqual(await energy(), {
    freeNetLimit: UPSTREAM_FREE_NET,
    EnergyLimit: 0,
    EnergyUsed: 0,
  });

  assert.equal((await uploadHash(data)).resCode, 100);
  assert.equal((await energy()).EnergyLimit, 0);
  assert.equal(await orderStatus(data), "wait_sale");
  assert.deepEqual(await energy(), {
    freeNetLimit: UPSTREAM_FREE_NET,
    EnergyLimit: data.pledgeNum,
    EnergyUsed: 0,
  });
  assert.equal(await orderStatus(data), "complete");
});

test("deliveryTimeout times the paid order out and never delivers", async () => {
  fake.setScenario("deliveryTimeout");
  const { data } = await order();
  await uploadHash(data);

  assert.equal(await orderStatus(data), "wait_sale");
  assert.equal(await orderStatus(data), "timeout");
  assert.equal((await energy()).EnergyLimit, 0);
});

test("a new scenario starts with no orders", async () => {
  const { data } = await order();
  await uploadHash(data);
  await orderStatus(data);
  fake.setScenario("happy");

  assert.equal((await energy()).EnergyLimit, 0);
  assert.equal(await orderStatus(data), undefined);
});

test("patches the account's TRX and USDT balances, keeping its other tokens", async () => {
  const { data } = await get<Accounts>(`/trongrid/v1/accounts/${PAYER}`);

  assert.equal(data[0].balance, 20_000_000);
  assert.deepEqual(data[0].trc20, [{ [USDC]: "7" }, { [USDT]: "50000000" }]);
});

test("synthesizes an active account for an address TronGrid has no data for", async () => {
  const { data } = await get<Accounts>(`/trongrid/v1/accounts/${UNKNOWN_ACCOUNT}`);

  assert.deepEqual(data, [
    { address: base58ToHex(UNKNOWN_ACCOUNT), balance: 20_000_000, trc20: [{ [USDT]: "50000000" }] },
  ]);
  // The app reads an account without free bandwidth as empty.
  assert.deepEqual(
    await get<AccountResource>(
      `/trongrid/wallet/getaccountresource?address=${base58ToHex(UNKNOWN_ACCOUNT)}`,
    ),
    { freeNetLimit: 600, EnergyLimit: 0, EnergyUsed: 0 },
  );
});

test("should keep TronGrid's free bandwidth when it reports one", async () => {
  assert.equal((await energy()).freeNetLimit, UPSTREAM_FREE_NET);
});

test("insufficientBalance drops the USDT balance to 1 base unit unless told otherwise", async () => {
  fake.setScenario("insufficientBalance");
  assert.equal(await usdtOf(PAYER), "1");

  fake.setScenario("insufficientBalance", { usdtBalance: 2_000_000 });
  assert.equal(await usdtOf(PAYER), "2000000");
});

test("simulates USDT transfers locally and proxies other contract calls", async () => {
  const call = {
    owner_address: base58ToHex(PAYER),
    function_selector: "transfer(address,uint256)",
    parameter: "00",
  };
  const simulated = await post<{ result: { result: boolean }; energy_used: number }>(
    "/trongrid/wallet/triggerconstantcontract",
    { ...call, contract_address: base58ToHex(USDT) },
  );
  assert.deepEqual([simulated.result.result, simulated.energy_used], [true, 64_285]);
  assert.equal(upstream.calls.length, 0);

  await post("/trongrid/wallet/triggerconstantcontract", {
    ...call,
    contract_address: base58ToHex(USDC),
  });
  assert.equal(upstream.calls[0].url, "/wallet/triggerconstantcontract");
});

test("answers broadcasts locally and never forwards them", async () => {
  const { data } = await order();
  const rawDataHex = data.transaction.raw_data_hex;
  const size = rawDataHex.length / 2; // two-byte varint: 128 <= size < 16384
  const sizeVarint = Buffer.from([(size & 0x7f) | 0x80, size >> 7]).toString("hex");
  const signedHex = `0a${sizeVarint}${rawDataHex}1241${"ab".repeat(65)}`;

  const viaJson = await post<{ result: boolean; txid: string }>(
    "/trongrid/wallet/broadcasttransaction",
    { ...data.transaction, signature: ["ab"] },
  );
  const viaHex = await post<{ result: boolean; txid: string }>("/trongrid/wallet/broadcasthex", {
    transaction: signedHex,
  });

  assert.deepEqual(viaJson, { result: true, code: "SUCCESS", txid: data.transaction.txID });
  assert.deepEqual(viaHex, { result: true, code: "SUCCESS", txid: data.transaction.txID });
  assert.equal(upstream.calls.filter(({ url }) => url?.includes("broadcast")).length, 0);
  assert.deepEqual(
    fake.log().map(({ path }) => path),
    [
      "/api/tronRent/addTronRentRecord",
      "/trongrid/wallet/broadcasttransaction",
      "/trongrid/wallet/broadcasthex",
    ],
  );
});

test("should redact signatures and signed transactions when it logs a request", async () => {
  const { data } = await order();
  await uploadHash(data);
  await post("/trongrid/wallet/broadcasttransaction", { ...data.transaction, signature: ["ab"] });
  // Answered from the signed hex itself: only the log is redacted.
  const answer = await post<{ result: boolean }>("/trongrid/wallet/broadcasthex", {
    transaction: "0a02abab",
  });
  assert.equal(answer.result, true);

  const [, upload, viaJson, viaHex] = fake.log();
  // Ids, order and amounts stay readable.
  assert.deepEqual(upload.body, {
    orderId: data.orderId,
    fromHash: data.transaction.txID,
    signedData: { ...data.transaction, signature: "[redacted]" },
  });
  assert.deepEqual(viaJson.body, { ...data.transaction, signature: "[redacted]" });
  assert.deepEqual(viaHex.body, { transaction: "[redacted]" });
  assert.deepEqual(await get("/__log"), fake.log());
});

test("should answer 500 when TronGrid's answer to patch is not JSON", async () => {
  const response = await fetch(`${fake.tronGridUrl}/v1/accounts/${MALFORMED_ACCOUNT}`);

  assert.equal(response.status, 500);
  assert.ok(((await response.json()) as { error?: string }).error);
});

test("answers a percent-encoded broadcast locally", async () => {
  const once = await post<{ result: boolean }>("/trongrid/wallet/broadc%61sttransaction", {
    txID: "ab",
  });
  const twice = await post<{ result: boolean }>("/trongrid/wallet/broadc%2561sthex", {
    transaction: `0a02${"ab".repeat(2)}`,
  });

  assert.deepEqual([once.result, twice.result], [true, true]);
  assert.equal(upstream.calls.length, 0);
});

test("refuses a TronGrid path it cannot decode, without proxying it", async () => {
  const response = await fetch(`${fake.tronGridUrl}/wallet/broadc%E0%A4%A`);

  assert.equal(response.status, 400);
  assert.equal(upstream.calls.length, 0);
});

test("proxies other TronGrid calls with their method, path, query and body", async () => {
  const response = await post<{ upstream: boolean }>("/trongrid/wallet/getblock?visible=true", {
    id_or_num: "1",
  });
  await get("/trongrid/v1/accounts/" + PAYER + "/transactions/trc20?limit=1");

  assert.equal(response.upstream, true);
  assert.deepEqual(upstream.calls, [
    { method: "POST", url: "/wallet/getblock?visible=true", body: { id_or_num: "1" } },
    { method: "GET", url: `/v1/accounts/${PAYER}/transactions/trc20?limit=1`, body: undefined },
  ]);
});

test("a new scenario starts with an empty request log", async () => {
  await quote();
  fake.setScenario("happy");

  assert.deepEqual(fake.log(), []);
});

test("switches scenarios and serves the request log over HTTP", async () => {
  await quote();
  await post("/__scenario", { scenario: "quoteError" });
  await quote();

  const log = await get<unknown[]>("/__log");
  assert.deepEqual(log, [
    {
      method: "POST",
      path: "/api/tronRent/queryPreorderInfo",
      body: ORDER_REQUEST,
      scenario: "quoteError",
    },
  ]);
  assert.deepEqual(fake.log(), log);
});

test("should resolve when the rent order reaches the fake while it waits", async () => {
  const waited = expectRentOrderedFromFake(fake, 5_000);
  await order();

  await waited;
});

test("should refuse to sign when no rent order reached the fake", async () => {
  await quote();

  await assert.rejects(expectRentOrderedFromFake(fake, 300), /refusing to sign a TX-A/);
});

test("answers CORS preflights so a renderer can call it", async () => {
  const response = await fetch(`${fake.url}/api/tronRent/queryPreorderInfo`, {
    method: "OPTIONS",
    headers: {
      origin: "http://localhost",
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type,x-ledger-client-version",
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(
    response.headers.get("access-control-allow-headers"),
    "content-type,x-ledger-client-version",
  );
  assert.equal(fake.log().length, 0);
});
