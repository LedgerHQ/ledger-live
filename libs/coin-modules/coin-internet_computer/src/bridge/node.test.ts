import { Cbor, HttpAgent } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { firstValueFrom, toArray } from "rxjs";
import { type IcpContext, type IcpCurrencyConfig, internet_computerDefaults } from "../config";
import { deriveAddressFromPubkey } from "../logic/crypto";
import { getCanisterIdlFunc, indexIdlFactory, ledgerIdlFactory } from "../network/candid";
import type { TransactionWithId } from "../network/idl/index.types";
import type { ICPAccount } from "../types";
import { createBridges } from "./index";

// The node signatures of a query reply cannot come from a test key, so the agent skips them.
jest.mock("../network/agent", () => ({
  getAgent: (host: string) => HttpAgent.create({ host, verifyQuerySignatures: false }),
}));

const LOCAL_NODE = "http://127.0.0.1:4943";
const XPUB =
  "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";
const CHAIN_LENGTH = 100n;

const localConfig = {
  status: { type: "active" },
  name: "Internet Computer",
  unit: { name: "ICP", code: "ICP", magnitude: 8 },
  node: { url: LOCAL_NODE },
} satisfies IcpCurrencyConfig;

const contextWith = (config: () => IcpCurrencyConfig): IcpContext => ({
  config: async () => config(),
  logger: () => {},
});

// Synced up to the tip already: a sync reads the tip, the balance and the newest page of history.
const account = {
  type: "Account",
  id: `js:2:internet_computer:${XPUB}:`,
  currency: { id: "internet_computer", coinType: 223 },
  derivationMode: "",
  index: 0,
  freshAddress: deriveAddressFromPubkey(XPUB),
  xpub: XPUB,
  blockHeight: Number(CHAIN_LENGTH),
  operations: [],
  pendingOperations: [],
} as unknown as ICPAccount;

/** The account's transactions the index canister lists, newest first. */
let listed: TransactionWithId[];

const replyTo = (method: string, arg: Uint8Array): Uint8Array => {
  if (method === "query_blocks") {
    return IDL.encode(getCanisterIdlFunc(ledgerIdlFactory, "query_blocks").retTypes, [
      {
        certificate: [],
        blocks: [],
        chain_length: CHAIN_LENGTH,
        first_block_index: 0n,
        archived_blocks: [],
      },
    ]);
  }
  if (method === "get_account_identifier_balance") {
    return IDL.encode(
      getCanisterIdlFunc(indexIdlFactory, "get_account_identifier_balance").retTypes,
      [5n],
    );
  }
  if (method === "get_account_identifier_transactions") {
    const func = getCanisterIdlFunc(indexIdlFactory, "get_account_identifier_transactions");
    const [{ start }] = IDL.decode(func.argTypes, arg) as unknown as [{ start: [] | [bigint] }];
    const [before] = start;
    const transactions = listed.filter(({ id }) => before === undefined || id < before);
    return IDL.encode(func.retTypes, [{ Ok: { balance: 5n, transactions, oldest_tx_id: [] } }]);
  }
  throw new Error(`Unexpected query: ${method}`);
};

/** The origin of each query the nodes received. */
let queried: string[];

const server = setupServer(
  http.post("*/api/:version/canister/:canisterId/query", async ({ request }) => {
    queried.push(new URL(request.url).origin);
    const { content } = Cbor.decode<{ content: { method_name: string; arg: Uint8Array } }>(
      new Uint8Array(await request.arrayBuffer()),
    );
    return new HttpResponse(
      Buffer.from(
        Cbor.encode({
          status: "replied",
          reply: { arg: new Uint8Array(replyTo(content.method_name, content.arg)) },
        }),
      ),
      { headers: { "Content-Type": "application/cbor" } },
    );
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
beforeEach(() => {
  queried = [];
  listed = [];
});

const signerContext = jest.fn();

const sync = async (bridges: ReturnType<typeof createBridges>, from = account) => {
  const updates = await firstValueFrom(
    bridges.accountBridge.sync(from, { paginationConfig: {} }).pipe(toArray()),
  );
  return updates.reduce((updated, update) => update(updated), from);
};

describe("createBridges node", () => {
  it("syncs each bridge pair against its own node", async () => {
    const local = createBridges(
      signerContext,
      contextWith(() => localConfig),
    );
    const mainnet = createBridges(
      signerContext,
      contextWith(() => internet_computerDefaults.internet_computer),
    );

    await sync(local);
    expect(queried).toEqual([LOCAL_NODE, LOCAL_NODE, LOCAL_NODE]);

    queried = [];
    await sync(mainnet);
    expect(queried).toEqual(["https://ic0.app", "https://ic0.app", "https://ic0.app"]);
  });

  // Read once per sync, not once per bridge: a changed config reaches the next sync, and one sync
  // never splits across two nodes.
  it("reads the config once per sync", async () => {
    const urls = ["http://127.0.0.1:1111", "http://127.0.0.1:2222"];
    let reads = 0;
    const bridges = createBridges(
      signerContext,
      contextWith(() => ({ ...localConfig, node: { url: urls[reads++] } })),
    );

    await sync(bridges);
    expect(reads).toBe(1);
    expect(queried).toEqual([urls[0], urls[0], urls[0]]);

    queried = [];
    await sync(bridges);
    expect(reads).toBe(2);
    expect(queried).toEqual([urls[1], urls[1], urls[1]]);
  });

  it("scans accounts against the node the config names", async () => {
    const device = jest.fn(async (_deviceId: string, fn: (signer: unknown) => Promise<unknown>) =>
      fn({
        getAddressAndPubKey: async () => ({
          address: Buffer.from(deriveAddressFromPubkey(XPUB), "hex"),
          publicKey: Buffer.from(XPUB, "hex"),
          principalText: "",
        }),
      }),
    );
    const { currencyBridge } = createBridges(
      device as never,
      contextWith(() => localConfig),
    );

    const event = await firstValueFrom(
      currencyBridge.scanAccounts({
        currency: getCryptoCurrencyById("internet_computer"),
        deviceId: "",
        syncConfig: { paginationConfig: {} },
      }),
    );

    expect(event.type).toBe("discovered");
    expect(new Set(queried)).toEqual(new Set([LOCAL_NODE]));
  });

  it("fails the sync when the config cannot be read", async () => {
    const broken = createBridges(
      signerContext,
      contextWith(() => {
        throw new Error("no coin config");
      }),
    );

    await expect(sync(broken)).rejects.toThrow("no coin config");
    expect(queried).toEqual([]);
  });
});

describe("account history", () => {
  const bridges = createBridges(
    signerContext,
    contextWith(() => localConfig),
  );

  const received: TransactionWithId = {
    id: CHAIN_LENGTH - 1n,
    transaction: {
      memo: 0n,
      icrc1_memo: [],
      operation: {
        Transfer: {
          from: "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37",
          to: deriveAddressFromPubkey(XPUB),
          amount: { e8s: 5n },
          fee: { e8s: 10_000n },
          spender: [],
        },
      },
      timestamp: [{ timestamp_nanos: 1_750_760_223_449_601_159n }],
      created_at_time: [{ timestamp_nanos: 1_750_760_220_000_000_000n }],
    },
  };

  it("gains a transaction the index lists after a sync reached its height", async () => {
    const beforeTheTransaction = { ...account, blockHeight: Number(CHAIN_LENGTH) - 1 };

    const beforeTheIndex = await sync(bridges, beforeTheTransaction);
    expect(beforeTheIndex.blockHeight).toBe(Number(CHAIN_LENGTH));
    expect(beforeTheIndex.operations).toEqual([]);

    listed = [received];
    const afterTheIndex = await sync(bridges, beforeTheIndex);
    expect(afterTheIndex.blockHeight).toBe(Number(CHAIN_LENGTH));
    expect(afterTheIndex.operations.map(op => [op.type, op.blockHeight])).toEqual([["IN", 99]]);
  });

  it("keeps its operations as they were when the newest page holds nothing new", async () => {
    listed = [received];
    const synced = await sync(bridges);

    const syncedAgain = await sync(bridges, synced);
    expect(syncedAgain.operations).toEqual(synced.operations);
    expect(syncedAgain.operationsCount).toBe(1);
  });
});
