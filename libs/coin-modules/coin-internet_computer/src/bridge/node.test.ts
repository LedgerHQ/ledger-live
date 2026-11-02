import { Cbor, HttpAgent } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { firstValueFrom, toArray } from "rxjs";
import type { IcpCurrencyConfig } from "../config";
import { deriveAddressFromPubkey } from "../logic/crypto";
import { getCanisterIdlFunc, indexIdlFactory, ledgerIdlFactory } from "../network/candid";
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

// Synced up to the tip already, so the sync reads the tip and the balance but no history.
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

const replyTo = (method: string): Uint8Array => {
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
  throw new Error(`Unexpected query: ${method}`);
};

/** The origin of each query the nodes received. */
let queried: string[];

const server = setupServer(
  http.post("*/api/:version/canister/:canisterId/query", async ({ request }) => {
    queried.push(new URL(request.url).origin);
    const { content } = Cbor.decode<{ content: { method_name: string } }>(
      new Uint8Array(await request.arrayBuffer()),
    );
    return new HttpResponse(
      Buffer.from(
        Cbor.encode({
          status: "replied",
          reply: { arg: new Uint8Array(replyTo(content.method_name)) },
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
});

const signerContext = jest.fn();

const sync = (bridges: ReturnType<typeof createBridges>) =>
  firstValueFrom(bridges.accountBridge.sync(account, { paginationConfig: {} }).pipe(toArray()));

describe("createBridges node", () => {
  it("syncs each bridge pair against its own node", async () => {
    const local = createBridges(signerContext, () => localConfig);
    const mainnet = createBridges(signerContext);

    await sync(local);
    expect(queried).toEqual([LOCAL_NODE, LOCAL_NODE]);

    queried = [];
    await sync(mainnet);
    expect(queried).toEqual(["https://ic0.app", "https://ic0.app"]);
  });

  // Read once per sync, not once per bridge: a changed config reaches the next sync, and one sync
  // never splits across two nodes.
  it("reads the config once per sync", async () => {
    const urls = ["http://127.0.0.1:1111", "http://127.0.0.1:2222"];
    let reads = 0;
    const bridges = createBridges(signerContext, () => ({
      ...localConfig,
      node: { url: urls[reads++] },
    }));

    await sync(bridges);
    expect(reads).toBe(1);
    expect(queried).toEqual([urls[0], urls[0]]);

    queried = [];
    await sync(bridges);
    expect(reads).toBe(2);
    expect(queried).toEqual([urls[1], urls[1]]);
  });

  it("fails the sync when the config provider throws", async () => {
    const broken = createBridges(signerContext, () => {
      throw new Error("no coin config");
    });

    await expect(sync(broken)).rejects.toThrow("no coin config");
    expect(queried).toEqual([]);
  });
});
