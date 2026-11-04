import { Cbor, Certificate, LookupPathStatus } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { ICP_NETWORK_URL, MAINNET_LEDGER_CANISTER_ID } from "../consts";
import { broadcastTxn, readTransferOutcome } from "./api";
import { getCanisterIdlFunc, ledgerIdlFactory } from "./candid";

// No test key can sign a certificate the real BLS check accepts, so only its creation is replaced;
// the root key it is handed is what the test reads.
jest.mock("@icp-sdk/core/agent", () => ({
  ...jest.requireActual("@icp-sdk/core/agent"),
  Certificate: { create: jest.fn() },
}));

const LOCAL_NODE = "http://127.0.0.1:4943";
const LOCAL_ROOT_KEY = new Uint8Array(133).fill(9);
const REQUEST_ID_HEX = "ab".repeat(32);

/** The URL of each request the nodes received. */
let received: string[];

const server = setupServer(
  http.post("*/api/:version/canister/:canisterId/:type", ({ request }) => {
    received.push(request.url);
    return new HttpResponse(new Uint8Array([1]));
  }),
  http.get(`${LOCAL_NODE}/api/v2/status`, ({ request }) => {
    received.push(request.url);
    return new HttpResponse(Buffer.from(Cbor.encode({ root_key: LOCAL_ROOT_KEY })), {
      headers: { "Content-Type": "application/cbor" },
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
beforeEach(() => {
  received = [];
});
afterEach(() => jest.clearAllMocks());

describe("broadcastTxn node", () => {
  it.each([LOCAL_NODE, ICP_NETWORK_URL])("submits a call to %s", async host => {
    await broadcastTxn(host, Buffer.from("00", "hex"), MAINNET_LEDGER_CANISTER_ID, "call");

    expect(received).toEqual([`${host}/api/v3/canister/${MAINNET_LEDGER_CANISTER_ID}/call`]);
  });

  it("polls read_state on the same node", async () => {
    await broadcastTxn(
      LOCAL_NODE,
      Buffer.from("00", "hex"),
      MAINNET_LEDGER_CANISTER_ID,
      "read_state",
    );

    expect(received).toEqual([
      `${LOCAL_NODE}/api/v2/canister/${MAINNET_LEDGER_CANISTER_ID}/read_state`,
    ]);
  });
});

describe("readTransferOutcome node", () => {
  it("verifies a local node's certificate against the root key that node serves", async () => {
    const reply = new Uint8Array(
      IDL.encode(getCanisterIdlFunc(ledgerIdlFactory, "transfer").retTypes, [{ Ok: 1n }]),
    );
    jest.mocked(Certificate.create).mockResolvedValue({
      lookup_path: ([, , leaf]: unknown[]) => {
        if (leaf === "status")
          return { status: LookupPathStatus.Found, value: Buffer.from("replied") };
        if (leaf === "reply") return { status: LookupPathStatus.Found, value: reply };
        return { status: LookupPathStatus.Absent };
      },
    } as unknown as Certificate);
    const syncCall = new Uint8Array(
      Cbor.encode({ status: "replied", certificate: new Uint8Array([1]) }),
    );

    await expect(readTransferOutcome(LOCAL_NODE, syncCall, REQUEST_ID_HEX)).resolves.toEqual({
      Ok: 1n,
    });

    expect(received).toEqual([`${LOCAL_NODE}/api/v2/status`]);
    expect(jest.mocked(Certificate.create).mock.calls[0][0].rootKey).toEqual(LOCAL_ROOT_KEY);
  });
});
