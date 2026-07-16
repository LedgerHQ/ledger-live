import { afterEach, describe, expect, it } from "bun:test";
import {
  EarnApiError,
  getCurrencyProviders,
  getEarnApiBaseUrl,
  getGrow,
  getSolanaValidatorApy,
  getSolanaValidators,
  getSolanaValidatorApyUrl,
  getSolanaValidatorsUrl,
  getEthTxStatus,
  getStakes,
  getStakesV3,
  postDefiApprove,
} from "./api";

const realFetch = globalThis.fetch;

type Captured = { url: string; init?: RequestInit };

function mockFetch(payload: unknown, status = 200): Captured {
  const captured: Captured = { url: "" };
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.url = String(input);
    captured.init = init;
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return captured;
}

function mockEmptyFetch(status: number): Captured {
  const captured: Captured = { url: "" };
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.url = String(input);
    captured.init = init;
    return new Response(null, { status });
  }) as typeof fetch;
  return captured;
}

/**
 * Route responses by URL substring. Used where one call fans out to several endpoints (e.g. the
 * Solana validators list + the Figment APY summary), so each receives its own payload. `urls`
 * records every requested URL in order. A URL with no match returns 404.
 */
function mockFetchByUrl(routes: { match: string; payload: unknown; status?: number }[]): {
  urls: string[];
} {
  const urls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);
    const route = routes.find(r => url.includes(r.match));
    if (!route) return new Response(JSON.stringify({}), { status: 404 });
    return new Response(JSON.stringify(route.payload), {
      status: route.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return { urls };
}

/** Make every `fetch` call reject, simulating a transport failure (network down / DNS error). */
function mockRejectFetch(error: Error = new Error("network down")): void {
  globalThis.fetch = (async (_input: RequestInfo | URL, _init?: RequestInit) => {
    throw error;
  }) as unknown as typeof fetch;
}

/**
 * Like `mockFetchByUrl` but serves a raw (possibly non-JSON) body string per route, so the
 * `JSON.parse` failure paths can be exercised. A URL with no match returns 404.
 */
function mockRawFetchByUrl(routes: { match: string; body: string; status?: number }[]): {
  urls: string[];
} {
  const urls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);
    const route = routes.find(r => url.includes(r.match));
    if (!route) return new Response("{}", { status: 404 });
    return new Response(route.body, {
      status: route.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return { urls };
}

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.EARN_API_BASE_URL;
  delete process.env.SOLANA_VALIDATORS_URL;
  delete process.env.SOLANA_VALIDATOR_APY_URL;
});

describe("earn-api base URL", () => {
  it("defaults to the production earn API", () => {
    expect(getEarnApiBaseUrl()).toBe("https://earn.api.live.ledger.com");
  });

  it("can be overridden via EARN_API_BASE_URL (trailing slash stripped)", () => {
    process.env.EARN_API_BASE_URL = "https://earn.example.test/";
    expect(getEarnApiBaseUrl()).toBe("https://earn.example.test");
  });
});

describe("getGrow", () => {
  it("parses a grow response and sets the dashboard_supported query", async () => {
    const captured = mockFetch([
      {
        provider: "Kiln",
        network: "solana",
        deposit_token: "solana",
        interest: { type: "APY", value: "0.056", currency: "solana" },
        dashboard_enabled: true,
        providers: [
          {
            id: "kiln_solana",
            currency: "solana",
            provider: "Kiln",
            receipt_currency: "solana",
            last_update: "2026-06-05T14:34:45Z",
          },
        ],
        type: "Supported",
      },
    ]);

    const result = await getGrow();
    expect(captured.url).toContain("/v0/grow?dashboard_supported=true");
    expect(result).toHaveLength(1);
    expect(result[0].provider).toBe("Kiln");
    expect(result[0].interest.value).toBe("0.056");
  });
});

describe("getCurrencyProviders", () => {
  it("parses providers and keeps unknown categories as strings", async () => {
    mockFetch([
      {
        id: "lido",
        name: "Lido",
        apy: 2.47,
        category: "liquid",
        icon: "Lido:provider",
        liveAppId: "lido",
        active: true,
        rewardsCurrency: "stETH",
      },
      {
        id: "future",
        name: "Future",
        category: "brand-new-category",
        icon: "x",
        liveAppId: "y",
        active: false,
      },
    ]);

    const result = await getCurrencyProviders("ethereum");
    expect(result).toHaveLength(2);
    expect(result[0].apy).toBe(2.47);
    expect(result[1].category).toBe("brand-new-category");
  });
});

describe("getStakes", () => {
  it("POSTs the batch and parses the bare array (v1)", async () => {
    const captured = mockFetch([{ network: "solana", state: "active" }]);
    const result = await getStakes([{ network: "solana", address: "abc", fresh: true }]);

    expect(captured.init?.method).toBe("POST");
    expect(JSON.parse(String(captured.init?.body))).toEqual([
      { network: "solana", address: "abc", fresh: true },
    ]);
    expect(result).toHaveLength(1);
  });

  it("parses the v3 wrapper with meta.is_stale", async () => {
    mockFetch({
      data: [],
      meta: {
        is_stale: true,
        stale_at: "2026-06-05T14:39:06Z",
        responded_at: "2026-06-05T14:39:10Z",
      },
    });
    const result = await getStakesV3([{ network: "solana", address: "abc" }]);
    expect(result.data).toEqual([]);
    expect(result.meta.is_stale).toBe(true);
  });

  it("parses the v3 wrapper when meta.stale_at is null (some L2 networks)", async () => {
    mockFetch({
      data: [],
      meta: {
        is_stale: false,
        stale_at: null,
        responded_at: "2026-06-05T14:39:10Z",
      },
    });
    const result = await getStakesV3([{ network: "base", address: "0xabc" }]);
    expect(result.data).toEqual([]);
    expect(result.meta.is_stale).toBe(false);
  });

  it("defaults data to [] when the backend omits it (spec marks data optional)", async () => {
    mockFetch({ meta: { is_stale: false, responded_at: "2026-06-05T14:39:10Z" } });
    const result = await getStakesV3([{ network: "solana", address: "abc" }]);
    expect(result.data).toEqual([]);
    expect(result.meta.is_stale).toBe(false);
  });

  it("throws when meta is omitted (meta is required in v3)", async () => {
    // `data` alone is not a valid v3 envelope: `meta` (with is_stale/responded_at) is required.
    mockFetch({ data: [] });
    await expect(getStakesV3([{ network: "solana", address: "abc" }])).rejects.toThrow();
  });
});

describe("postDefiApprove", () => {
  const request = {
    wallet: "0x1111111111111111111111111111111111111111",
    asset: "0x2222222222222222222222222222222222222222",
    chain_id: 1,
    vault: "0x3333333333333333333333333333333333333333",
    amount: "1000000",
    ignore_checks: true,
  };

  it("returns a no-action result for 204", async () => {
    const captured = mockEmptyFetch(204);
    const result = await postDefiApprove(request);

    expect(captured.init?.method).toBe("POST");
    expect(result).toEqual({ status: 204, kind: "no-action" });
  });

  it("parses a 200 approve transaction", async () => {
    mockFetch({
      data: {
        wallet: request.wallet,
        to: request.asset,
        data: "0x095ea7b3",
        value: "0",
        nonce: 1,
        gas_limit: 50000,
        chain_id: 1,
      },
    });

    const result = await postDefiApprove(request);

    expect(result.kind).toBe("transaction");
    if (result.kind === "transaction") {
      expect(result.data.to).toBe(request.asset);
      expect(result.data.data).toBe("0x095ea7b3");
    }
  });
});

describe("getSolanaValidators", () => {
  it("defaults to the validator-details endpoint and can be overridden", () => {
    expect(getSolanaValidatorsUrl()).toBe(
      "https://earn.api.live.ledger.com/v0/network/solana/validator-details",
    );
    process.env.SOLANA_VALIDATORS_URL = "https://validators.example.test/list.json";
    expect(getSolanaValidatorsUrl()).toBe("https://validators.example.test/list.json");
  });

  it("defaults the APY summary url to the production earn API host and can be overridden", () => {
    expect(getSolanaValidatorApyUrl()).toBe(
      "https://earn.api.live.ledger.com/figment/solana/validators_summary",
    );
    process.env.SOLANA_VALIDATOR_APY_URL = "https://apy.example.test/summary";
    expect(getSolanaValidatorApyUrl()).toBe("https://apy.example.test/summary");
  });

  it("parses the validators list, keeps nullable fields, and merges Figment APY by vote account", async () => {
    const { urls } = mockFetchByUrl([
      {
        match: "validator-details",
        payload: [
          {
            vote_account: "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx",
            name: "Ledger by Figment",
            commission: 7,
            total_score: 7,
            active_stake: 123456,
            delinquent: false,
          },
          { vote_account: "VoteAcct2", name: null, commission: null, total_score: null },
        ],
      },
      {
        match: "validators_summary",
        payload: [
          {
            address: "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx",
            delegator_apy: 0.078107,
            name: "Ledger by Figment",
          },
        ],
      },
    ]);

    const result = await getSolanaValidators();

    expect(urls.some(u => u.includes("validator-details"))).toBe(true);
    expect(urls.some(u => u.includes("validators_summary"))).toBe(true);
    expect(result).toHaveLength(2);
    expect(result[0].vote_account).toBe("26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx");
    expect(result[0].commission).toBe(7);
    expect(result[0].apy).toBe(0.078107);
    expect(result[1].name).toBeNull();
    expect(result[1].apy).toBeUndefined();
  });

  it("still returns validators (without APY) when the Figment summary fails", async () => {
    mockFetchByUrl([
      {
        match: "validator-details",
        payload: [
          {
            vote_account: "VoteAcct1",
            name: "Kiln",
            commission: 5,
            total_score: 9,
            active_stake: 1,
          },
        ],
      },
      { match: "validators_summary", payload: { error: "down" }, status: 503 },
    ]);

    const result = await getSolanaValidators();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Kiln");
    expect(result[0].apy).toBeUndefined();
  });

  it("throws when the validators list is a 200 with a non-JSON body", async () => {
    mockRawFetchByUrl([
      { match: "validator-details", body: "<html>maintenance</html>" },
      { match: "validators_summary", body: "[]" },
    ]);
    await expect(getSolanaValidators()).rejects.toThrow(/non-JSON response/);
  });

  it("throws when a validator entry is missing the required vote_account", async () => {
    mockFetchByUrl([
      // `vote_account` is required by SolanaValidatorSchema; its absence must fail validation
      // rather than silently producing a row with no `--product` value.
      { match: "validator-details", payload: [{ name: "No Vote Account", commission: 5 }] },
      { match: "validators_summary", payload: [] },
    ]);
    await expect(getSolanaValidators()).rejects.toThrow();
  });
});

describe("getEthTxStatus", () => {
  it("parses the status from the body on success", async () => {
    const captured = mockFetch({ data: { status: "success" } });
    const result = await getEthTxStatus("0xabc");
    expect(captured.url).toContain("/v1/defi/eth/transaction/status");
    expect(captured.url).toContain("tx_hash=0xabc");
    expect(result.data.status).toBe("success");
  });

  it("maps a not-yet-mined 5xx (receipt not found) to pending_confirmation instead of throwing", async () => {
    // A freshly broadcast tx has no receipt yet: the backend answers 500. This must be treated as a
    // transient race so the poll loop keeps waiting rather than aborting the deposit.
    mockFetch({ message: "TransactionReceiptNotFoundError" }, 500);
    const result = await getEthTxStatus("0xpending");
    expect(result.data.status).toBe("pending_confirmation");
  });

  it("throws a non-retryable EarnApiError on a 4xx (genuine client error) rather than masquerading as pending", async () => {
    // A 4xx (bad/unknown tx hash, bad params) never resolves on its own, so surfacing it as
    // pending would just spin the full poll loop. It must throw a typed, non-retryable error instead.
    mockFetch({ message: "bad tx hash" }, 400);
    await expect(getEthTxStatus("0xbad")).rejects.toThrow(/failed: 400/);
    await expect(getEthTxStatus("0xbad")).rejects.toBeInstanceOf(EarnApiError);
  });

  it("throws a non-retryable EarnApiError on a 2xx with an unparseable body (no status to parse)", async () => {
    // A 200 with no body yields `body: undefined`; this is an API contract violation that will not
    // self-resolve, so it must surface as a non-retryable EarnApiError rather than fabricating a status.
    mockEmptyFetch(200);
    await expect(getEthTxStatus("0xempty")).rejects.toBeInstanceOf(EarnApiError);
  });

  it("rethrows when the transport fails (network down)", async () => {
    mockRejectFetch(new Error("ECONNREFUSED"));
    await expect(getEthTxStatus("0xdown")).rejects.toThrow(/ECONNREFUSED/);
  });
});

describe("getSolanaValidatorApy", () => {
  it("degrades to {} on a transport error", async () => {
    mockRejectFetch(new Error("network down"));
    expect(await getSolanaValidatorApy()).toEqual({});
  });

  it("degrades to {} when the summary has an unexpected shape", async () => {
    // The summary must be an array; an object fails the schema and is swallowed to {} so the
    // validators are still listed (APY is best-effort context).
    mockFetch({ not: "an array" });
    expect(await getSolanaValidatorApy()).toEqual({});
  });
});

describe("error handling", () => {
  it("throws a descriptive error on non-2xx", async () => {
    mockFetch({ message: "bad request" }, 400);
    await expect(getGrow()).rejects.toThrow(/Earn API GET \/v0\/grow failed: 400/);
  });

  it("throws a descriptive error when the validators list is unavailable", async () => {
    mockFetch({ message: "nope" }, 503);
    await expect(getSolanaValidators()).rejects.toThrow(/Solana validators GET failed: 503/);
  });
});
