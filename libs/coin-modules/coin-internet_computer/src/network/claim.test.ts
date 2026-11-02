import { Cbor, requestIdOf } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { ICP_NETWORK_URL } from "../consts";
import { ICPStakeNotRefreshed } from "../errors";
import { claimOrRefreshNeuronFromAccount } from "./api";

/** The request id and the expiry of each claim the node received. */
let requestIds: string[];
let expiries: bigint[];

// Refused before replication, so each claim settles at once, without a read_state poll.
const server = setupServer(
  http.post("*/api/v3/canister/:canisterId/call", async ({ request }) => {
    const { content } = Cbor.decode<{ content: Parameters<typeof requestIdOf>[0] }>(
      new Uint8Array(await request.arrayBuffer()),
    );
    requestIds.push(Buffer.from(requestIdOf(content)).toString("hex"));
    expiries.push(BigInt(String(content.ingress_expiry)));
    return new HttpResponse(
      Buffer.from(Cbor.encode({ status: "non_replicated_rejection", reject_message: "busy" })),
    );
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
beforeEach(() => {
  requestIds = [];
  expiries = [];
  // A frozen clock keeps both claims in one expiry minute, so only the nonce can tell them apart.
  jest.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 0, 1, 12, 0, 30));
});
afterEach(() => jest.restoreAllMocks());

describe("claimOrRefreshNeuronFromAccount request id", () => {
  // The expiry is rounded to the minute: two claims of one neuron within it must still be two
  // requests, or the IC answers the second with the first one's reply and never runs it.
  it("sends each claim of the same neuron as a distinct request", async () => {
    const controller = Principal.anonymous();

    for (const _ of [1, 2]) {
      await expect(
        claimOrRefreshNeuronFromAccount(ICP_NETWORK_URL, controller, 5n),
      ).rejects.toThrow(ICPStakeNotRefreshed);
    }

    expect(requestIds).toHaveLength(2);
    expect(expiries[0]).toBe(expiries[1]);
    expect(requestIds[0]).not.toBe(requestIds[1]);
  });
});
