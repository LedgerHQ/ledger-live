import { Cbor, Certificate } from "@dfinity/agent";
import { ICPCallRejected, ICPStakeNotRefreshed } from "../errors";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import {
  claimOrRefreshNeuronFromAccount,
  decodeListNeuronsReply,
  decodeManageNeuronReply,
  readReplyFromCanister,
  readTransferOutcome,
  throwIfLedgerTransferRefused,
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

  // A 202 is the node taking the call without a certificate to show for it yet. It used to be
  // reported as a failed broadcast — for a call that, as often as not, went on to execute.
  it("polls when the node took the call but had no certificate for it", async () => {
    (Certificate.create as jest.Mock).mockResolvedValue(certWith("replied", encStr("LATE")));
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ status: 202, arrayBuffer: async () => new ArrayBuffer(0) }) // /call
      .mockResolvedValue({
        status: 200,
        arrayBuffer: async () => Cbor.encode({ certificate: new Uint8Array([2]) }), // read_state
      });
    (global as unknown as { fetch: unknown }).fetch = fetchMock;

    const out = await readReplyFromCanister(
      Buffer.from("00", "hex"),
      Buffer.from("01", "hex"),
      CANISTER,
      REQ_ID_HEX,
    );

    expect(out && new TextDecoder().decode(out)).toBe("LATE");
    expect(fetchMock.mock.calls[1][0]).toContain("read_state");
  }, 10000);

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

  // The node answers 200 for a call it turned away before replication, with the rejection in place
  // of a certificate. Nothing ran; polling for a status such a call will never have only delays
  // saying so, and then says "outcome unknown" instead.
  it("reports a call refused before replication as rejected, without polling", async () => {
    const fetchMock = respondingWith({
      status: "non_replicated_rejection",
      reject_code: 3,
      reject_message: "boom",
      error_code: "IC0406",
    });

    const attempt = readReplyFromCanister(
      Buffer.from("00", "hex"),
      Buffer.from("01", "hex"),
      CANISTER,
      REQ_ID_HEX,
    );

    await expect(attempt).rejects.toThrow(ICPCallRejected);
    await expect(attempt).rejects.toMatchObject({ reason: "boom" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // A read the node refuses — expired along with the call whose expiry it carries, or rate-limited
  // — says nothing about the call, so the poll goes on rather than reporting the call refused.
  it("keeps polling when a read of the call's status is refused", async () => {
    (Certificate.create as jest.Mock).mockResolvedValue(certWith("replied", encStr("LATE")));
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ status: 202, arrayBuffer: async () => new ArrayBuffer(0) }) // /call
      .mockResolvedValueOnce({ status: 429, text: async () => "rate limited" }) // read_state
      .mockResolvedValue({
        status: 200,
        arrayBuffer: async () => Cbor.encode({ certificate: new Uint8Array([2]) }), // read_state
      });
    (global as unknown as { fetch: unknown }).fetch = fetchMock;

    const out = await readReplyFromCanister(
      Buffer.from("00", "hex"),
      Buffer.from("01", "hex"),
      CANISTER,
      REQ_ID_HEX,
    );

    expect(out && new TextDecoder().decode(out)).toBe("LATE");
    expect(fetchMock).toHaveBeenCalledTimes(3);
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

  // The transfer has settled by the time governance answers, so the refusal is its own class rather
  // than a bare Error, with the canister's wording carried for the copy.
  it("throws ICPStakeNotRefreshed with the governance wording when the claim is refused", async () => {
    driveWith(
      encodeReply("claim_or_refresh_neuron_from_account", {
        result: [{ Error: { error_type: 0, error_message: "denied" } }],
      }),
    );
    const attempt = claimOrRefreshNeuronFromAccount(Principal.anonymous(), 5n);
    await expect(attempt).rejects.toThrow(ICPStakeNotRefreshed);
    await expect(attempt).rejects.toMatchObject({ reason: "denied" });
  });

  // A claim the network rejected leaves the same state as one governance refused: the transfer
  // settled, the neuron is unclaimed. Reported as a rejected call it would read as "nothing ran" and
  // be offered a retry — a second transfer.
  it("reports a rejected claim call as a settled transfer left unclaimed", async () => {
    (Certificate.create as jest.Mock).mockResolvedValue(certWith("rejected"));
    respondingWith({ status: "rejected", certificate: new Uint8Array([1]) });

    const attempt = claimOrRefreshNeuronFromAccount(Principal.anonymous(), 5n);
    await expect(attempt).rejects.toThrow(ICPStakeNotRefreshed);
    await expect(attempt).rejects.toMatchObject({ reason: "boom" });
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

// A synchronous /call response certifying the transfer request has a terminal status.
const syncReplied = () =>
  new Uint8Array(Cbor.encode({ status: "replied", certificate: new Uint8Array([1]) }));

describe("readTransferOutcome", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns the ledger's verdict from a certified reply", async () => {
    (Certificate.create as jest.Mock).mockResolvedValue(
      certWith("replied", encodeLedgerReply({ Ok: 42n })),
    );
    await expect(readTransferOutcome(syncReplied(), REQ_ID_HEX)).resolves.toEqual({ Ok: 42n });
  });

  it("returns a refusal the ledger replied with, for the caller to report", async () => {
    (Certificate.create as jest.Mock).mockResolvedValue(
      certWith("replied", encodeLedgerReply({ Err: { TxTooOld: { allowed_window_nanos: 1n } } })),
    );
    await expect(readTransferOutcome(syncReplied(), REQ_ID_HEX)).resolves.toEqual({
      Err: { TxTooOld: { allowed_window_nanos: 1n } },
    });
  });

  // A certificate marking the call `rejected` says the transfer never ran. It used to surface as a
  // reply that could not be found — a failure with no name, so no retry for a stake that never
  // happened.
  it("reports a certified rejection as a rejected call", async () => {
    (Certificate.create as jest.Mock).mockResolvedValue(certWith("rejected"));

    const attempt = readTransferOutcome(syncReplied(), REQ_ID_HEX);

    await expect(attempt).rejects.toThrow(ICPCallRejected);
    await expect(attempt).rejects.toMatchObject({ reason: "boom" });
  });

  it("reports a call refused before replication as a rejected call", async () => {
    const refused = new Uint8Array(
      Cbor.encode({
        status: "non_replicated_rejection",
        reject_code: 3,
        reject_message: "boom",
        error_code: "IC0406",
      }),
    );

    const attempt = readTransferOutcome(refused, REQ_ID_HEX);

    await expect(attempt).rejects.toThrow(ICPCallRejected);
    await expect(attempt).rejects.toMatchObject({ reason: "boom" });
    expect(Certificate.create).not.toHaveBeenCalled();
  });

  // Not a verdict: the certificate says the call is still in flight, or its reply is gone, so
  // nothing here can say what the ledger did. Left nameless for the caller to classify.
  it("fails plainly when the certified status is not terminal", async () => {
    (Certificate.create as jest.Mock).mockResolvedValue(certWith("processing"));

    const attempt = readTransferOutcome(syncReplied(), REQ_ID_HEX);

    await expect(attempt).rejects.toThrow(/Reply status not found/);
    await expect(attempt).rejects.not.toBeInstanceOf(ICPCallRejected);
  });

  it("fails plainly when the certificate does not verify", async () => {
    (Certificate.create as jest.Mock).mockRejectedValue(new Error("Invalid certificate"));

    const attempt = readTransferOutcome(syncReplied(), REQ_ID_HEX);

    await expect(attempt).rejects.toThrow(/Invalid certificate/);
    await expect(attempt).rejects.not.toBeInstanceOf(ICPCallRejected);
  });
});

describe("throwIfLedgerTransferRefused", () => {
  it("throws the ledger's reason when it refused the transfer", () => {
    expect(() =>
      throwIfLedgerTransferRefused({ Err: { TxTooOld: { allowed_window_nanos: 1n } } }),
    ).toThrow(/TxTooOld/);
  });

  it("does nothing when the transfer went through", () => {
    expect(() => throwIfLedgerTransferRefused({ Ok: 42n })).not.toThrow();
  });
});
