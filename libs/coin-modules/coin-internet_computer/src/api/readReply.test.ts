import { Cbor, Certificate } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import {
  claimOrRefreshNeuronFromAccount,
  decodeListNeuronsReply,
  decodeManageNeuronReply,
  ensureTransferCallAccepted,
  readReplyFromCanister,
} from "./api";
import { getCanisterIdlFunc, governanceIdlFactory, ledgerIdlFactory } from "../network/candid";

// Encode a governance canister *reply* (return value) using the real vendored IDL, so the decode
// functions run against genuine candid bytes rather than a hand-rolled buffer.
const encodeReply = (method: string, value: unknown): ArrayBuffer =>
  IDL.encode(getCanisterIdlFunc(governanceIdlFactory, method).retTypes, [value]) as ArrayBuffer;

const encodeLedgerReply = (value: unknown): ArrayBuffer =>
  IDL.encode(getCanisterIdlFunc(ledgerIdlFactory, "transfer").retTypes, [value]) as ArrayBuffer;

// Keep the real @dfinity/agent (Cbor, lookupResultToBuffer, IDL, …); mock only certificate creation
// so we can drive terminalReply's status branches without a real BLS certificate.
jest.mock("@dfinity/agent", () => ({
  ...jest.requireActual("@dfinity/agent"),
  Certificate: { create: jest.fn() },
}));

// getRootKey() reads the agent's embedded root key; stub the agent so no network/embedded-key logic runs.
jest.mock("../network/agent", () => ({
  getAgent: jest.fn().mockResolvedValue({ rootKey: new ArrayBuffer(0) }),
}));

const CANISTER = "rrkah-fqaaa-aaaaa-aaaaq-cai";
const REQ_ID_HEX = "ab".repeat(32); // 32-byte request id

const encStr = (s: string): ArrayBuffer => {
  const u = new TextEncoder().encode(s);
  return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength);
};
const FOUND = (value: ArrayBuffer) => ({ status: "found", value });
const ABSENT = { status: "absent" };

// A stand-in Certificate whose `lookup` answers the request_status leaves terminalReply asks for.
const certWith = (status: string, reply?: ArrayBuffer) => ({
  lookup: (path: unknown[]) => {
    const leaf = path[2];
    if (leaf === "status") return FOUND(encStr(status));
    if (leaf === "reject_message") return FOUND(encStr("boom"));
    if (leaf === "reply") return reply ? FOUND(reply) : ABSENT;
    return ABSENT;
  },
});

const respondingWith = (...bodies: unknown[]) => {
  const fetchMock = jest.fn();
  bodies.forEach(body =>
    fetchMock.mockResolvedValueOnce({ status: 200, arrayBuffer: async () => Cbor.encode(body) }),
  );
  // Any further calls repeat the last body (keeps the poll loop fed).
  fetchMock.mockResolvedValue({
    status: 200,
    arrayBuffer: async () => Cbor.encode(bodies[bodies.length - 1]),
  });
  (global as unknown as { fetch: unknown }).fetch = fetchMock;
  return fetchMock;
};

describe("readReplyFromCanister", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("returns the reply from a synchronous `replied` certificate without polling", async () => {
    (Certificate.create as jest.Mock).mockResolvedValue(certWith("replied", encStr("REPLY")));
    const fetchMock = respondingWith({ status: "replied", certificate: new Uint8Array([1, 2, 3]) });

    const out = await readReplyFromCanister(
      Buffer.from("00", "hex"),
      undefined,
      CANISTER,
      REQ_ID_HEX,
    );

    expect(out && new TextDecoder().decode(out)).toBe("REPLY");
    expect(fetchMock).toHaveBeenCalledTimes(1); // sync /call only, no read_state poll
  });

  it("throws with the reject message on a `rejected` status", async () => {
    (Certificate.create as jest.Mock).mockResolvedValue(certWith("rejected"));
    respondingWith({ status: "rejected", certificate: new Uint8Array([1]) });

    await expect(
      readReplyFromCanister(Buffer.from("00", "hex"), undefined, CANISTER, REQ_ID_HEX),
    ).rejects.toThrow(/call rejected: boom/);
  });

  it("returns null (indeterminate) when there is no certificate and no read-state envelope", async () => {
    respondingWith({ status: "processing" }); // no certificate field
    const out = await readReplyFromCanister(
      Buffer.from("00", "hex"),
      undefined,
      CANISTER,
      REQ_ID_HEX,
    );
    expect(out).toBeNull();
  });

  it("polls the read-state envelope until a terminal reply arrives", async () => {
    (Certificate.create as jest.Mock)
      .mockResolvedValueOnce(certWith("processing")) // sync cert: not yet terminal
      .mockResolvedValue(certWith("replied", encStr("POLLED"))); // read_state cert: terminal
    respondingWith(
      { status: "processing", certificate: new Uint8Array([1]) }, // /call
      { certificate: new Uint8Array([2]) }, // read_state
    );

    const out = await readReplyFromCanister(
      Buffer.from("00", "hex"),
      Buffer.from("01", "hex"),
      CANISTER,
      REQ_ID_HEX,
    );
    expect(out && new TextDecoder().decode(out)).toBe("POLLED");
  }, 10000);
});

describe("decodeManageNeuronReply", () => {
  it("throws the governance error_message when the command failed", () => {
    const reply = encodeReply("manage_neuron", {
      command: [{ Error: { error_type: 0, error_message: "nope" } }],
    });
    expect(() => decodeManageNeuronReply(reply)).toThrow("nope");
  });

  it("does not throw when the command is not an error", () => {
    const reply = encodeReply("manage_neuron", { command: [] });
    expect(() => decodeManageNeuronReply(reply)).not.toThrow();
  });

  // The one command in the flow that states its own result, so the neuron can be brought up to date
  // from the canister's figures instead of the app's arithmetic.
  it("reads the maturity totals a StakeMaturity command reports", () => {
    const reply = encodeReply("manage_neuron", {
      command: [
        { StakeMaturity: { maturity_e8s: 200_000_000n, staked_maturity_e8s: 300_000_000n } },
      ],
    });

    expect(decodeManageNeuronReply(reply)).toEqual({
      maturityE8s: "200000000",
      stakedMaturityE8s: "300000000",
    });
  });

  it.each([
    ["an empty command", []],
    ["a command that reports nothing", [{ Configure: {} }]],
  ])("reports no outcome for %s", (_case, command) => {
    const reply = encodeReply("manage_neuron", { command });

    expect(decodeManageNeuronReply(reply)).toBeUndefined();
  });
});

describe("decodeListNeuronsReply", () => {
  it("decodes a list_neurons response into the raw neuron snapshot", () => {
    const reply = encodeReply("list_neurons", {
      neuron_infos: [],
      full_neurons: [],
      total_pages_available: [],
    });
    const out = decodeListNeuronsReply(reply);
    expect(out.full_neurons).toEqual([]);
    expect(out.neuron_infos).toEqual([]);
  });
});

describe("claimOrRefreshNeuronFromAccount", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  // Drive the whole read path: the sync /call returns a `replied` certificate whose reply is the
  // given governance response, so readReplyFromCanister resolves without polling.
  const driveWith = (reply: ArrayBuffer) => {
    (Certificate.create as jest.Mock).mockResolvedValue(certWith("replied", reply));
    respondingWith({ status: "replied", certificate: new Uint8Array([1]) });
  };

  it("returns the neuron id on a successful claim/refresh", async () => {
    driveWith(
      encodeReply("claim_or_refresh_neuron_from_account", { result: [{ NeuronId: { id: 123n } }] }),
    );
    const id = await claimOrRefreshNeuronFromAccount(Principal.anonymous(), 5n);
    expect(id).toBe(123n);
  });

  it("throws the governance error message when the claim is rejected", async () => {
    driveWith(
      encodeReply("claim_or_refresh_neuron_from_account", {
        result: [{ Error: { error_type: 0, error_message: "denied" } }],
      }),
    );
    await expect(claimOrRefreshNeuronFromAccount(Principal.anonymous(), 5n)).rejects.toThrow(
      "denied",
    );
  });

  it("returns undefined when the result is indeterminate (polling exhausted)", async () => {
    jest.useFakeTimers();
    try {
      // Neither the sync /call nor any read-state poll ever yields a certificate → poll exhausts → null.
      respondingWith({ status: "processing" });
      const promise = claimOrRefreshNeuronFromAccount(Principal.anonymous(), 5n);
      // Fast-forward past all read-state poll attempts without waiting in real time.
      for (let i = 0; i < 21; i += 1) await jest.advanceTimersByTimeAsync(1000);
      await expect(promise).resolves.toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("ensureTransferCallAccepted", () => {
  // A synchronous /call response certifying the transfer request has a terminal reply.
  const syncReplied = () =>
    new Uint8Array(Cbor.encode({ status: "replied", certificate: new Uint8Array([1]) }));

  afterEach(() => jest.clearAllMocks());

  it("resolves when the certified ledger transfer reply is Ok", async () => {
    (Certificate.create as jest.Mock).mockResolvedValue(
      certWith("replied", encodeLedgerReply({ Ok: 42n })),
    );
    await expect(ensureTransferCallAccepted(syncReplied(), REQ_ID_HEX)).resolves.toBeUndefined();
  });

  it("throws when the certified ledger transfer reply is an Err", async () => {
    (Certificate.create as jest.Mock).mockResolvedValue(
      certWith("replied", encodeLedgerReply({ Err: { TxTooOld: { allowed_window_nanos: 1n } } })),
    );
    await expect(ensureTransferCallAccepted(syncReplied(), REQ_ID_HEX)).rejects.toThrow(/TxTooOld/);
  });
});
