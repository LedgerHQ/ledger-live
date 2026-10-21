import { randomUUID } from "node:crypto";
import http from "node:http";
import type { AddressInfo } from "node:net";
import {
  USDT_CONTRACT_HEX,
  base58ToHex,
  encodeRentPaymentRawData,
  hexToBase58,
  isUsdtTransfer,
  signedTransactionRawDataHex,
  trc20TransferCallHex,
  tronTxId,
} from "./txA";

export const FAKE_TRONIFY_PORT = Number(process.env.FAKE_TRONIFY_PORT ?? 4790);

/** The fake's urls before it starts, so a spec can put them in its coin-config at declaration time.
 * `host` is how the app under test reaches this machine. */
export function fakeTronifyUrls(
  host = "127.0.0.1",
  port = FAKE_TRONIFY_PORT,
): { url: string; tronGridUrl: string } {
  const url = `http://${host}:${port}`;
  return { url, tronGridUrl: `${url}/trongrid` };
}

/** Real Tronify payees that app-tron 0.8.0 lists, so the device names the service on the TX-A. */
export const TRONIFY_E2E_PAYEES = [
  "TDii6vao7xyWg2rKPbCPWVRpSmne8xcqYx",
  "TPyiQrP19oaLu5bQcn1UJDuRqvZAJvYqjQ",
  "TWXcJPJhtdVWNiLRU5b4iVL2wJXdiJ3Bmj",
];

/** The id of Tronify's option in the app's fee payment list. */
export const TRONIFY_OPTION_ID = "tronify";

/** USDT's unit, to format a rent the way the app formats it. */
export const USDT_UNIT = { name: "USDT", code: "USDT", magnitude: 6 };

/** The `config_currency_tron` override that points the app's Tron explorer and Tronify at the fake,
 * never at the real services. */
export function fakeTronifyCoinConfig(host?: string, port?: number) {
  return tronifyCoinConfig(fakeTronifyUrls(host, port));
}

/** {@link fakeTronifyCoinConfig} for a fake already listening, on whatever port it got. */
export function tronifyCoinConfig({ url, tronGridUrl }: Pick<FakeTronify, "url" | "tronGridUrl">) {
  return {
    config_currency_tron: {
      explorer: { url: tronGridUrl },
      energyRent: {
        provider: "tronify",
        tronify: { url, sourceFlag: "ledger-live", paymentAddresses: TRONIFY_E2E_PAYEES },
      },
    },
  };
}

/** The TronGrid the fake proxies: the env's proxy, else the live env's default. */
export function upstreamTronGrid(): string {
  return process.env.API_TRONGRID_PROXY || "https://tron.coin.ledger.com";
}

/** The Tronify endpoints that place a rent order and report its payment, as the fake logs them. */
export const RENT_ORDER_PATH = "/api/tronRent/addTronRentRecord";
export const RENT_PAYMENT_UPLOAD_PATH = "/api/tronRent/uploadHash";
const FAKE_POLL_MS = 250;

async function pollUntil(done: () => boolean, timeoutMs: number, failure: string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const poll = async (): Promise<void> => {
    if (done()) return;
    if (Date.now() >= deadline) throw new Error(failure);
    await new Promise(resolve => setTimeout(resolve, FAKE_POLL_MS));
    return poll();
  };
  await poll();
}

/**
 * SAFETY: call before signing a TX-A. The specs use real Tronify payees, so only the coin-config
 * override keeps the app off the real Tronify and, once TX-C is broadcast, off the real TronGrid.
 * Waits for the app's rent order and a TronGrid call to reach the fake, and throws if they don't,
 * so a spec whose override stopped applying fails before the device signs.
 */
export async function expectRentOrderedFromFake(
  fake: Pick<FakeTronify, "log">,
  timeoutMs = 30_000,
): Promise<void> {
  const reached = (prefix: string) => fake.log().some(({ path }) => path.startsWith(prefix));
  await pollUntil(
    () => reached(RENT_ORDER_PATH) && reached("/trongrid/"),
    timeoutMs,
    `fake Tronify got no rent order and TronGrid call in ${timeoutMs} ms: refusing to sign a TX-A for the real services`,
  );
}

/** Waits for the app to broadcast a USDT `transfer(recipient, amount)`, which the fake answers and
 * never forwards. `amount` is in USDT, as the specs write it. */
export async function expectUsdtTransferBroadcastToFake(
  fake: Pick<FakeTronify, "broadcasts">,
  recipient: string | undefined,
  amount: string,
  timeoutMs = 30_000,
): Promise<void> {
  await pollUntil(
    () => hasUsdtTransferBroadcast(fake, recipient, amount),
    timeoutMs,
    `fake TronGrid got no broadcast of ${amount} USDT to ${recipient} in ${timeoutMs} ms`,
  );
}

/** Whether the app broadcast a USDT `transfer(recipient, amount)`. `amount` is in USDT. */
export function hasUsdtTransferBroadcast(
  fake: Pick<FakeTronify, "broadcasts">,
  recipient: string | undefined,
  amount: string,
): boolean {
  if (!recipient) throw new Error("The transaction has no recipient address to look for");
  const toHex = base58ToHex(recipient);
  const baseUnits = parseUsdt(amount);
  return fake.broadcasts().some(({ rawDataHex }) => isUsdtTransfer(rawDataHex, toHex, baseUnits));
}

const SCENARIOS = [
  "happy",
  "quoteError",
  "deliveryTimeout",
  "submitFailed",
  "priceRose",
  "badPayee",
  "overCap",
  "memo",
  "insufficientBalance",
] as const;

export type FakeTronifyScenario = (typeof SCENARIOS)[number];

export type FakeRequest = {
  method: string;
  path: string;
  body: unknown;
  scenario: FakeTronifyScenario;
};

export type FakeBroadcast = { txid: string; rawDataHex: string };

export type FakeOrder = { orderId: string; payee: string };

export type FakeTronify = {
  /** Tronify base url: coin-tron appends `/api/tronRent/<endpoint>`. */
  url: string;
  /** TronGrid base url, for coin-config's `explorer.url`. */
  tronGridUrl: string;
  /** Starts afresh: drops every order, so no scenario sees energy an earlier one delivered, and the
   * request log. Balance and energy patches apply to every address: an unactivated recipient looks
   * active. */
  setScenario(scenario: FakeTronifyScenario, params?: Record<string, unknown>): void;
  log(): FakeRequest[];
  /** The transactions broadcast since the scenario was set, answered here and never forwarded. */
  broadcasts(): FakeBroadcast[];
  /** The rent orders placed since the scenario was set, oldest first. */
  orders(): FakeOrder[];
  /** Delivers the energy of every paid order, even under `deliveryTimeout`: a rent landing late. */
  landPaidRents(): void;
  close(): Promise<void>;
};

export type FakeTronifyOptions = {
  port?: number;
  payees: string[];
  upstreamTronGrid: string;
  usdtBalance?: bigint;
  trxBalanceSun?: bigint;
};

const USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const ONE_USDT = 1_000_000n;
// The real quote of 2026-10-15; overCap sits above coin-tron's 10 USDT default maxRentAmount.
const QUOTED_RENT = 3_169_455n;
const OVER_CAP_RENT = 12n * ONE_USDT;
// priceRose: 1.5 times the quote, rounded up to a base unit.
const raised = (rent: bigint) => (rent * 3n + 1n) / 2n;
// In USDT mode Tronify also rents the energy its own payment burns: 64285 asked, 128685 quoted.
const RENT_PAYMENT_ENERGY = 64_400;
const USDT_TRANSFER_ENERGY = 64_285;
// The daily free bandwidth of an active mainnet account.
const FREE_NET_LIMIT = 600;
// Stale TAPOS (the June 2026 payment's) on purpose: a TX-A signed by a funded seed can't land on chain.
const REF_BLOCK = { bytes: "8ed0", hash: "7280df3dd121c50c" };
const PAYMENT_LIFETIME_MS = 6 * 60_000;
const PAYMENT_FEE_LIMIT = 100_000_000;
const MEMO = "ledger-live e2e";
const BAD_PAYEE = hexToBase58("41" + "e2e0".repeat(10));

type OrderRequest = {
  fromAddress: string;
  pledgeAddress: string;
  pledgeNum: number;
  pledgeDay: string;
  pledgeHour: string;
  pledgeMinute: string;
  extraTrxNum: string;
  sourceFlag: string;
};

type Order = {
  orderId: string;
  payee: string;
  fromAddress: string;
  pledgeAddress: string;
  pledgeNum: number;
  pledgeDay: string;
  createdAt: number;
  paid: boolean;
  /** The payment upload was refused. */
  refused: boolean;
  /** `mypayorder` reads since the payment arrived. */
  statusReads: number;
  /** Delivered by `landPaidRents`, whatever the scenario. */
  landedLate: boolean;
};

type Json = Record<string, unknown>;
type Account = { address: string; balance?: number; trc20?: Record<string, string>[] };

const stringField = (body: Json | undefined, key: string): string => {
  const value = body?.[key];
  return typeof value === "string" ? value : "";
};

const success = (data: unknown) => ({ resCode: 100, resMsg: "Success", data });
const failure = (message: string) => ({
  resCode: 500,
  resMsg: `fake Tronify: ${message}`,
  data: {},
});

const trimEnd = (text: string, char: string): string => {
  let end = text.length;
  while (end > 0 && text[end - 1] === char) end--;
  return text.slice(0, end);
};

const parseUsdt = (amount: string): bigint => {
  const [whole, fraction = ""] = amount.split(".");
  return BigInt(whole) * ONE_USDT + BigInt(fraction.padEnd(6, "0").slice(0, 6) || "0");
};

const formatUsdt = (baseUnits: bigint): string => {
  const fraction = trimEnd((baseUnits % ONE_USDT).toString().padStart(6, "0"), "0");
  return fraction ? `${baseUnits / ONE_USDT}.${fraction}` : `${baseUnits / ONE_USDT}`;
};

/** The rents the fake charges, in USDT, as the device and the app display them. */
export const FAKE_TRONIFY_RENT = {
  quoted: formatUsdt(QUOTED_RENT),
  /** What a `priceRose` order asks for. */
  raised: formatUsdt(raised(QUOTED_RENT)),
};

const toHex = (address: string): string =>
  /^41[0-9a-f]{40}$/i.test(address) ? address.toLowerCase() : base58ToHex(address);

const isUsdt = (address: unknown): boolean =>
  typeof address === "string" && (address === USDT || address.toLowerCase() === USDT_CONTRACT_HEX);

// The desktop renderer calls cross-origin.
const CORS_HEADERS = { "access-control-allow-origin": "*" };

// Hop-by-hop and length headers belong to each leg, not to the request.
const UNFORWARDED_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-length",
  "accept-encoding",
  "upgrade",
  "expect",
]);

function send(res: http.ServerResponse, status: number, payload: unknown): void {
  // Before the headers, so a payload that won't serialize still gets the 500 fallback.
  const json = JSON.stringify(payload);
  res.writeHead(status, { ...CORS_HEADERS, "content-type": "application/json" });
  res.end(json);
}

const REDACTED = "[redacted]";

// The log is attached to CI reports, and a signed transfer stays valid on mainnet for minutes:
// signatures and signed transaction hex (broadcasthex's `transaction`) are dropped from it.
function redactSigned(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSigned);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      const signed = key === "signature" || (key === "transaction" && typeof entry === "string");
      return [key, signed ? REDACTED : redactSigned(entry)];
    }),
  );
}

async function readBody(req: http.IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

// Decoded until stable, so no layering of percent-encoding hides a broadcast. Undefined if malformed.
function decodePath(path: string): string | undefined {
  let decoded = path;
  try {
    for (let previous = ""; previous !== decoded;) {
      previous = decoded;
      decoded = decodeURIComponent(decoded);
    }
  } catch {
    return undefined;
  }
  return decoded;
}

function parseBody(raw: Buffer): unknown {
  if (raw.length === 0) return undefined;
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    return raw.toString("utf8"); // logged as text
  }
}

/**
 * A fake Tronify, plus a TronGrid proxy that feeds coin-tron what each scenario needs: the payer's
 * balances, its energy before and after the rent, and a USDT transfer simulation.
 */
export async function startFakeTronify(opts: FakeTronifyOptions): Promise<FakeTronify> {
  const upstreamTronGrid = trimEnd(opts.upstreamTronGrid, "/");
  const requests: FakeRequest[] = [];
  const broadcasts: FakeBroadcast[] = [];
  let scenario: FakeTronifyScenario = "happy";
  let params: Record<string, unknown> = {};
  let orders: Order[] = [];

  function setScenario(next: FakeTronifyScenario, nextParams: Record<string, unknown> = {}) {
    if (!SCENARIOS.includes(next)) throw new Error(`Unknown fake Tronify scenario: ${next}`);
    scenario = next;
    params = nextParams;
    orders = [];
    requests.length = 0;
    broadcasts.length = 0;
  }

  const quotedRent = () => (scenario === "overCap" ? OVER_CAP_RENT : QUOTED_RENT);
  const orderedRent = () => (scenario === "priceRose" ? raised(quotedRent()) : quotedRent());
  const usdtBalance = () => {
    if (scenario !== "insufficientBalance") return opts.usdtBalance;
    const balance = params.usdtBalance;
    return typeof balance === "number" || typeof balance === "string" || typeof balance === "bigint"
      ? BigInt(balance)
      : 1n;
  };

  // Tronify's "timeout" is coin-tron's "failed" (its ORDER_STATUS map). After a refused upload
  // live-common reads it as the payment not having landed; while polling, as a failed delivery.
  function statusOf(order: Order): string {
    // So a refused upload ends as a failed rent payment with retry locked (SUBMIT_FAILURE).
    if (order.refused) return "timeout";
    if (!order.paid) return "wait_deposit_send";
    if (order.statusReads === 0) return "wait_sale";
    // So deliveryTimeout fails within seconds as DELIVERY_FAILED, not via the 120 s poll timeout.
    return scenario === "deliveryTimeout" && !order.landedLate ? "timeout" : "complete";
  }

  // Lands after the paid order's first poll, so the app shows its waiting state before the transfer.
  const delivered = (order: Order) =>
    order.paid && order.statusReads > 0 && (scenario !== "deliveryTimeout" || order.landedLate);

  // The fields a quote and an order share.
  const offer = (body: OrderRequest, rent: bigint) => ({
    fromAddress: body.fromAddress,
    pledgeAddress: body.pledgeAddress,
    pledgeDay: body.pledgeDay,
    pledgeHour: body.pledgeHour,
    pledgeMinute: body.pledgeMinute,
    source: body.sourceFlag,
    orderType: "ENERGY",
    orderPrice: 65,
    pledgeNum: Number(body.pledgeNum) + RENT_PAYMENT_ENERGY,
    pledgeTrxNum: "9.434525",
    payCoinCode: "USDT",
    payCoinAmt: formatUsdt(rent),
    extraTrxNum: body.extraTrxNum,
    pledgeBandwidthNum: 0,
    activeAccountFee: "0",
    purchaseTRXFee: "0.359458",
    purchaseBandwidthFee: "0",
    purchaseEnergyFee: "2.809997",
  });

  const quote = (body: OrderRequest) => ({
    ...offer(body, quotedRent()),
    usdtModeAvailable: true,
    transferTrxFee: 0.27,
  });

  function placeOrder(body: OrderRequest) {
    // Real orders pay the listed payees in turn.
    const payee =
      scenario === "badPayee" ? BAD_PAYEE : opts.payees[orders.length % opts.payees.length];
    const rent = orderedRent();
    const ownerHex = toHex(body.fromAddress);
    const timestamp = Date.now();
    const expiration = timestamp + PAYMENT_LIFETIME_MS;
    const memo = scenario === "memo" ? MEMO : undefined;
    const rawDataHex = encodeRentPaymentRawData({
      ownerHex,
      payeeHex: toHex(payee),
      amountBaseUnits: rent,
      refBlockBytes: REF_BLOCK.bytes,
      refBlockHash: REF_BLOCK.hash,
      expiration,
      timestamp,
      feeLimit: PAYMENT_FEE_LIMIT,
      memo,
    });
    const terms = offer(body, rent);
    const order: Order = {
      orderId: randomUUID().replaceAll("-", "_"),
      payee,
      fromAddress: body.fromAddress,
      pledgeAddress: body.pledgeAddress,
      pledgeNum: terms.pledgeNum,
      pledgeDay: body.pledgeDay,
      createdAt: timestamp,
      paid: false,
      refused: false,
      statusReads: 0,
      landedLate: false,
    };
    orders.push(order);
    return {
      orderId: order.orderId,
      platformAddr: payee,
      ...terms,
      transaction: {
        raw_data: {
          ref_block_bytes: REF_BLOCK.bytes,
          ref_block_hash: REF_BLOCK.hash,
          expiration,
          ...(memo ? { data: Buffer.from(memo, "utf8").toString("hex") } : {}),
          contract: [
            {
              parameter: {
                value: {
                  owner_address: ownerHex,
                  contract_address: USDT_CONTRACT_HEX,
                  data: trc20TransferCallHex(toHex(payee), rent),
                },
                type_url: "type.googleapis.com/protocol.TriggerSmartContract",
              },
              type: "TriggerSmartContract",
            },
          ],
          timestamp,
          fee_limit: PAYMENT_FEE_LIMIT,
        },
        raw_data_hex: rawDataHex,
        txID: tronTxId(rawDataHex),
        visible: false,
      },
    };
  }

  function uploadHash({ orderId }: { orderId: string }) {
    const order = orders.find(entry => entry.orderId === orderId);
    if (!order) return failure(`unknown order ${orderId}`);
    if (scenario === "submitFailed") {
      order.refused = true;
      return failure("payment upload rejected");
    }
    order.paid = true;
    return success({});
  }

  function myPayOrder({ fromAddress, page, pageSize }: Json) {
    const data = orders
      .filter(order => order.fromAddress === fromAddress)
      .map(order => {
        const status = statusOf(order);
        if (order.paid) order.statusReads++;
        const sold = status === "complete" ? order.pledgeNum : 0;
        return {
          orderId: order.orderId,
          fromAddress: order.fromAddress,
          pledgeAddress: order.pledgeAddress,
          pledgeNum: order.pledgeNum,
          salePledgeNum: sold,
          freezePledgeNum: sold,
          leftPledgeNum: order.pledgeNum - sold,
          orderPrice: "65",
          orderType: "ENERGY",
          pledgeDay: order.pledgeDay,
          orderStatus: status,
          createTime: new Date(order.createdAt).toISOString(),
        };
      });
    return { data, pagination: { page, pageSize, total: data.length } };
  }

  function tronify(endpoint: string, body: unknown) {
    switch (endpoint) {
      case "queryPreorderInfo":
        return scenario === "quoteError"
          ? failure("no energy for sale")
          : success(quote(body as OrderRequest));
      case "addTronRentRecord":
        return success(placeOrder(body as OrderRequest));
      case "uploadHash":
        return uploadHash(body as { orderId: string });
      case "mypayorder":
        return success(myPayOrder(body as Json));
      default:
        return undefined;
    }
  }

  function patchAccount(address: string, upstream: { data?: Account[] }) {
    const usdt = usdtBalance();
    const trx = opts.trxBalanceSun;
    if (usdt === undefined && trx === undefined) return upstream;
    // An address TronGrid has no data for is inactive: give it a minimal active account.
    const [account = { address: toHex(address), trc20: [] }, ...others] = upstream.data ?? [];
    const patched: Account = { ...account };
    if (trx !== undefined) patched.balance = Number(trx);
    if (usdt !== undefined) {
      patched.trc20 = [
        ...(account.trc20 ?? []).filter(entry => !(USDT in entry)),
        { [USDT]: usdt.toString() },
      ];
    }
    return { ...upstream, data: [patched, ...others] };
  }

  // Zero energy until a rent lands, so coin-tron always offers the rent.
  function patchEnergy(address: string, upstream: Json) {
    const hex = toHex(address);
    const rented = orders
      .filter(order => delivered(order) && toHex(order.pledgeAddress) === hex)
      .reduce((total, order) => total + order.pledgeNum, 0);
    // An inactive address has no free bandwidth, which the app reads as an empty account. Give it
    // what every active account gets, to match the account patchAccount synthesizes.
    const activated = usdtBalance() !== undefined || opts.trxBalanceSun !== undefined;
    const freeNet =
      activated && upstream.freeNetLimit === undefined ? { freeNetLimit: FREE_NET_LIMIT } : {};
    return { ...upstream, ...freeNet, EnergyLimit: rented, EnergyUsed: 0 };
  }

  async function proxy(req: http.IncomingMessage, pathAndQuery: string, raw: Buffer) {
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (value !== undefined && !UNFORWARDED_HEADERS.has(name)) {
        headers.set(name, Array.isArray(value) ? value.join(", ") : value);
      }
    }
    const response = await fetch(`${upstreamTronGrid}${pathAndQuery}`, {
      method: req.method,
      headers,
      body: raw.length > 0 ? new Uint8Array(raw) : undefined,
    });
    return {
      status: response.status,
      contentType: response.headers.get("content-type") ?? "application/json",
      body: Buffer.from(await response.arrayBuffer()),
    };
  }

  async function tronGrid(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    url: URL,
    raw: Buffer,
    body: Json | undefined,
  ) {
    const rawPath = url.pathname.slice("/trongrid".length);
    const path = decodePath(rawPath);
    // SAFETY: a broadcast is answered here and never forwarded — the specs sign with funded seeds.
    // A path that won't decode can't be ruled out as one, so it is refused.
    if (path === undefined) return send(res, 400, { error: `fake Tronify: bad path ${rawPath}` });
    if (/broadcast/i.test(path)) {
      const viaHex = path.endsWith("/broadcasthex");
      const rawDataHex = viaHex
        ? signedTransactionRawDataHex(String(body?.transaction))
        : stringField(body, "raw_data_hex");
      const txid = viaHex ? tronTxId(rawDataHex) : String(body?.txID);
      broadcasts.push({ txid, rawDataHex });
      return send(res, 200, { result: true, code: "SUCCESS", txid });
    }
    // TronGrid would revert the simulation for the empty test account.
    if (
      path === "/wallet/triggerconstantcontract" &&
      isUsdt(body?.contract_address) &&
      body?.function_selector === "transfer(address,uint256)"
    ) {
      return send(res, 200, {
        result: { result: true },
        energy_used: USDT_TRANSFER_ENERGY,
        constant_result: ["1".padStart(64, "0")],
      });
    }

    const upstream = await proxy(req, rawPath + url.search, raw);
    const account = /^\/v1\/accounts\/([^/]+)$/.exec(path)?.[1];
    const resourceOwner =
      path === "/wallet/getaccountresource"
        ? (url.searchParams.get("address") ?? String(body?.address))
        : undefined;
    if (upstream.status === 200 && account) {
      return send(res, 200, patchAccount(account, JSON.parse(upstream.body.toString("utf8"))));
    }
    if (upstream.status === 200 && resourceOwner) {
      return send(res, 200, patchEnergy(resourceOwner, JSON.parse(upstream.body.toString("utf8"))));
    }
    res.writeHead(upstream.status, { ...CORS_HEADERS, "content-type": upstream.contentType });
    res.end(upstream.body);
  }

  async function handle(req: http.IncomingMessage, res: http.ServerResponse) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        ...CORS_HEADERS,
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": req.headers["access-control-request-headers"] ?? "*",
      });
      res.end();
      return;
    }
    const url = new URL(req.url ?? "/", "http://localhost");
    const raw = await readBody(req);
    const body = parseBody(raw);

    if (url.pathname === "/__log") return send(res, 200, requests);
    if (url.pathname === "/__scenario") {
      const { scenario: next, params: nextParams } = body as {
        scenario: FakeTronifyScenario;
        params?: Record<string, unknown>;
      };
      setScenario(next, nextParams);
      return send(res, 200, { scenario });
    }

    requests.push({
      method: req.method ?? "GET",
      path: req.url ?? "/",
      body: redactSigned(body),
      scenario,
    });
    if (url.pathname.startsWith("/api/tronRent/")) {
      const response = tronify(url.pathname.slice("/api/tronRent/".length), body);
      return send(res, response ? 200 : 404, response ?? failure("unknown endpoint"));
    }
    if (url.pathname.startsWith("/trongrid/")) {
      return tronGrid(req, res, url, raw, body as Json | undefined);
    }
    send(res, 404, { error: `fake Tronify has no route for ${req.method} ${url.pathname}` });
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch((error: unknown) => {
      // Too late for a status: cut the connection so the client sees a failure, not a partial body.
      if (res.headersSent) {
        res.destroy();
        return;
      }
      send(res, 500, { error: error instanceof Error ? error.message : String(error) });
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(opts.port ?? FAKE_TRONIFY_PORT, "127.0.0.1", () => resolve());
  });
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  return {
    url,
    tronGridUrl: `${url}/trongrid`,
    setScenario,
    log: () => [...requests],
    broadcasts: () => [...broadcasts],
    orders: () => orders.map(({ orderId, payee }) => ({ orderId, payee })),
    landPaidRents: () => {
      for (const order of orders) if (order.paid) order.landedLate = true;
    },
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}
