import { makeScanAccounts } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
} from "@ledgerhq/ledger-wallet-framework/types";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { firstValueFrom } from "rxjs";
import { setCoinConfig } from "../../config";
import { getAccountShape } from "../../synchronisation";
import { TON_API_MOCKED, createMockTonContext, mockTonConfig } from "../../test/context";
import {
  OWNER,
  OWNER_JETTON_WALLET_RAW,
  OWNER_PUBLIC_KEY,
  excessRefundTx,
  jettonIn,
  jettonSendTx,
} from "../../test/history.fixtures";
import { isUsed } from "../isUsed";

const NOT_TOKEN = {
  id: TokenCurrencyIdSchema.parse("ton/jetton/eqavlwfdxgf2lxm67y4yzc17wykd9a0guwpkms1gosm__not"),
  type: "TokenCurrency" as const,
  contractAddress: "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT",
  parentCurrencyId: CryptoCurrencyIdSchema.parse("ton"),
  tokenType: "jetton",
  name: "Notcoin",
  ticker: "NOT",
  units: [{ name: "NOT", code: "NOT", magnitude: 9 }],
};

// An external message that moved no value: the sync maps it to no operation.
const valuelessTx = {
  ...jettonSendTx,
  hash: "valueless",
  lt: "48954600000001",
  in_msg: { ...jettonSendTx.in_msg, source: null, value: null },
  out_msgs: [],
};

type Chain = {
  balance?: string;
  lastLt?: string | null;
  transactions?: object[];
  jettonTransfers?: object[];
  knownJetton?: boolean;
};

// Pages as the indexer does: newest first, `end_lt` included, 256 rows at most.
const pageOf = <Row>(rows: Row[], ltOf: (row: Row) => string, endLt: string | null) =>
  rows.filter(row => endLt === null || BigInt(ltOf(row)) <= BigInt(endLt)).slice(0, 256);

const legacyScanUsed = async (blacklistedTokenIds: string[] = []) => {
  const scanned = await firstValueFrom(
    makeScanAccounts({
      getAccountShape,
      getAddressFn: async (_deviceId, { path }) => ({
        address: OWNER,
        path,
        publicKey: OWNER_PUBLIC_KEY,
      }),
    })({
      currency: getCryptoCurrencyById("ton"),
      deviceId: "",
      syncConfig: { paginationConfig: {}, blacklistedTokenIds },
      scheme: "ton",
    }),
    { defaultValue: undefined },
  );
  return scanned?.account.used ?? false;
};

describe("isUsed", () => {
  const server = setupServer();
  const context = createMockTonContext();
  const calls = jest.fn();
  let knownJetton = true;

  beforeAll(() => {
    setCoinConfig(() => mockTonConfig);
    setCryptoAssetsStore({
      findTokenById: async () => (knownJetton ? NOT_TOKEN : undefined),
      findTokenByAddressInCurrency: async () => (knownJetton ? NOT_TOKEN : undefined),
      getTokensSyncHash: async () => "0",
    });
    server.listen({ onUnhandledRequest: "error" });
  });
  afterEach(() => {
    server.resetHandlers();
    calls.mockReset();
  });
  afterAll(() => server.close());

  const serve = ({
    balance = "0",
    lastLt = null,
    transactions = [],
    jettonTransfers = [],
    knownJetton: known = true,
  }: Chain) => {
    knownJetton = known;
    server.use(
      http.get(`${TON_API_MOCKED}/masterchainInfo`, () =>
        HttpResponse.json({ last: { seqno: 1, root_hash: "", gen_utime: "0" } }),
      ),
      http.get(`${TON_API_MOCKED}/account`, () => {
        calls("account");
        return HttpResponse.json({
          balance,
          last_transaction_lt: lastLt,
          last_transaction_hash: null,
          status: "uninit",
        });
      }),
      http.get(`${TON_API_MOCKED}/transactions`, ({ request }) => {
        calls("transactions");
        const endLt = new URL(request.url).searchParams.get("end_lt");
        return HttpResponse.json({
          transactions: pageOf(transactions as { lt: string }[], tx => tx.lt, endLt),
          address_book: {},
        });
      }),
      http.get(`${TON_API_MOCKED}/jetton/transfers`, ({ request }) => {
        calls("jetton/transfers");
        const endLt = new URL(request.url).searchParams.get("end_lt");
        return HttpResponse.json({
          jetton_transfers: pageOf(
            jettonTransfers as { transaction_lt: string }[],
            transfer => transfer.transaction_lt,
            endLt,
          ),
        });
      }),
      http.get(`${TON_API_MOCKED}/adjacentTransactions`, () =>
        HttpResponse.json({ transactions: [], address_book: {} }),
      ),
      http.get(`${TON_API_MOCKED}/jetton/wallets`, () =>
        HttpResponse.json({
          jetton_wallets: [{ address: OWNER_JETTON_WALLET_RAW, balance: "0" }],
        }),
      ),
    );
  };

  const cases: [string, Chain, boolean][] = [
    ["no transaction and no balance", {}, false],
    ["an empty last transaction", { lastLt: "" }, false],
    ["a balance only", { balance: "1000" }, true],
    ["a transaction with value", { lastLt: "1", transactions: [excessRefundTx] }, true],
    ["a transaction without value", { lastLt: "1", transactions: [valuelessTx] }, false],
    [
      "a transfer of a known jetton",
      { lastLt: "1", transactions: [valuelessTx], jettonTransfers: [jettonIn] },
      true,
    ],
    [
      "a transfer of a jetton missing from the assets",
      { lastLt: "1", transactions: [valuelessTx], jettonTransfers: [jettonIn], knownJetton: false },
      false,
    ],
    [
      "a transaction with value past the first page",
      {
        lastLt: "1",
        transactions: [
          ...Array.from({ length: 256 }, (_, i) => ({
            ...valuelessTx,
            hash: `valueless-${i}`,
            lt: String(48954600000001 - i),
          })),
          excessRefundTx,
        ],
      },
      true,
    ],
  ];

  it("leaves out a blacklisted jetton, as the legacy scan skips its sub-account", async () => {
    serve({ lastLt: "1", transactions: [valuelessTx], jettonTransfers: [jettonIn] });
    await expect(legacyScanUsed([NOT_TOKEN.id])).resolves.toBe(false);
    await expect(isUsed(context, OWNER, [NOT_TOKEN.id])).resolves.toBe(false);
  });

  it.each(cases)("decides as the legacy scan with %s", async (_, chain, used) => {
    serve(chain);
    await expect(legacyScanUsed()).resolves.toBe(used);
    await expect(isUsed(context, OWNER)).resolves.toBe(used);
  });

  it("reads the account only, without a last transaction", async () => {
    serve({});
    await isUsed(context, OWNER);
    expect(calls.mock.calls).toEqual([["account"]]);
  });

  it("reads the account only, with a balance", async () => {
    serve({ balance: "1000", lastLt: "1", transactions: [excessRefundTx] });
    await isUsed(context, OWNER);
    expect(calls.mock.calls).toEqual([["account"]]);
  });

  it("stops at the first page mapping an operation, before the jettons", async () => {
    serve({ lastLt: "1", transactions: [excessRefundTx], jettonTransfers: [jettonIn] });
    await isUsed(context, OWNER);
    expect(calls.mock.calls).toEqual([["account"], ["transactions"]]);
  });

  it("stops paging and rejects with the reason once the context signal aborts", async () => {
    const controller = new AbortController();
    const reason = new Error("cancelled");
    serve({
      lastLt: "1",
      transactions: Array.from({ length: 600 }, (_, i) => ({
        ...valuelessTx,
        hash: `valueless-${i}`,
        lt: String(48954600000001 - i),
      })),
    });
    calls.mockImplementation(endpoint => {
      if (endpoint === "transactions") controller.abort(reason);
    });

    await expect(isUsed({ ...context, signal: controller.signal }, OWNER)).rejects.toBe(reason);
    expect(calls.mock.calls).toEqual([["account"], ["transactions"]]);
  });

  it("fetches nothing when the context signal is already aborted", async () => {
    const reason = new Error("cancelled");
    serve({});
    await expect(isUsed({ ...context, signal: AbortSignal.abort(reason) }, OWNER)).rejects.toBe(
      reason,
    );
    expect(calls).not.toHaveBeenCalled();
  });
});
