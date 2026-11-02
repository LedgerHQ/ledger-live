import { Cbor, HttpAgent } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { findNeuronIdBySubaccount, queryLedgerBalance } from "./api";
import {
  decodeCanisterIdlArgs,
  getCanisterIdlFunc,
  governanceIdlFactory,
  ledgerIdlFactory,
} from "./candid";

// The node signatures of a query reply cannot come from a test key, so the agent skips them.
jest.mock("./agent", () => ({
  getAgent: (host: string) => HttpAgent.create({ host, verifyQuerySignatures: false }),
}));

const listNeurons = getCanisterIdlFunc(governanceIdlFactory, "list_neurons");
const SUBACCOUNT = new Uint8Array(32).fill(5);

const NEURON_INFO = {
  dissolve_delay_seconds: 0n,
  recent_ballots: [],
  voting_power_refreshed_timestamp_seconds: [],
  potential_voting_power: [],
  neuron_type: [],
  deciding_voting_power: [],
  created_timestamp_seconds: 0n,
  state: 1,
  stake_e8s: 0n,
  joined_community_fund_timestamp_seconds: [],
  retrieved_at_timestamp_seconds: 0n,
  visibility: [],
  known_neuron_data: [],
  voting_power: 0n,
  age_seconds: 0n,
};

type QueryEnvelope = {
  content: { method_name: string; arg: Uint8Array; canister_id: Uint8Array };
};

let received: QueryEnvelope[];

const answering = (body: unknown) =>
  http.post(/^https:\/\/ic0\.app\/api\/v\d\/canister\/[^/]+\/query$/, async ({ request }) => {
    received.push(Cbor.decode<QueryEnvelope>(new Uint8Array(await request.arrayBuffer())));
    return new HttpResponse(Buffer.from(Cbor.encode(body)), {
      headers: { "Content-Type": "application/cbor" },
    });
  });

const listing = (neuronInfos: unknown[]) => ({
  status: "replied",
  reply: {
    arg: new Uint8Array(
      IDL.encode(listNeurons.retTypes, [
        { neuron_infos: neuronInfos, full_neurons: [], total_pages_available: [] },
      ]),
    ),
  },
});

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
beforeEach(() => {
  received = [];
});
afterEach(() => server.resetHandlers());

describe("findNeuronIdBySubaccount", () => {
  it("asks governance for the neuron of that subaccount alone", async () => {
    server.use(answering(listing([])));

    await findNeuronIdBySubaccount(SUBACCOUNT);

    expect(received).toHaveLength(1);
    expect(received[0].content.method_name).toBe("list_neurons");
    const [request] = decodeCanisterIdlArgs<
      [
        {
          neuron_ids: ArrayLike<bigint>;
          neuron_subaccounts: unknown;
          include_neurons_readable_by_caller: boolean;
        },
      ]
    >(listNeurons, received[0].content.arg);
    expect(request.neuron_ids).toHaveLength(0);
    expect(request.neuron_subaccounts).toEqual([[{ subaccount: SUBACCOUNT }]]);
    expect(request.include_neurons_readable_by_caller).toBe(false);
  });

  it("returns the id of the neuron listed for it", async () => {
    server.use(answering(listing([[123n, NEURON_INFO]])));

    await expect(findNeuronIdBySubaccount(SUBACCOUNT)).resolves.toBe("123");
  });

  it("returns undefined when no neuron is listed", async () => {
    server.use(answering(listing([])));

    await expect(findNeuronIdBySubaccount(SUBACCOUNT)).resolves.toBeUndefined();
  });

  it("throws when governance rejects the query", async () => {
    server.use(
      answering({ status: "rejected", reject_code: 5, reject_message: "busy", error_code: "IC0" }),
    );

    await expect(findNeuronIdBySubaccount(SUBACCOUNT)).rejects.toThrow(/Query failed|busy/);
  });
});

describe("queryLedgerBalance", () => {
  const accountBalance = getCanisterIdlFunc(ledgerIdlFactory, "account_balance");
  const ACCOUNT = "ab".repeat(32);

  it("asks the ledger for the account's balance and returns it", async () => {
    server.use(
      answering({
        status: "replied",
        reply: { arg: new Uint8Array(IDL.encode(accountBalance.retTypes, [{ e8s: 42n }])) },
      }),
    );

    await expect(queryLedgerBalance(ACCOUNT)).resolves.toBe(42n);
    expect(received[0].content.method_name).toBe("account_balance");
    const [{ account }] = decodeCanisterIdlArgs<[{ account: Uint8Array }]>(
      accountBalance,
      received[0].content.arg,
    );
    expect(Buffer.from(account).toString("hex")).toBe(ACCOUNT);
  });

  it("throws when the ledger rejects the query", async () => {
    server.use(
      answering({ status: "rejected", reject_code: 5, reject_message: "busy", error_code: "IC0" }),
    );

    await expect(queryLedgerBalance(ACCOUNT)).rejects.toThrow(/Query failed|busy/);
  });
});
