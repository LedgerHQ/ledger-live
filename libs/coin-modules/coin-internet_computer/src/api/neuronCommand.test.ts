import {
  Cbor,
  Certificate,
  IC_REQUEST_DOMAIN_SEPARATOR,
  LookupPathStatus,
  requestIdOf,
} from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { Secp256k1KeyIdentity } from "@icp-sdk/core/identity/secp256k1";
import type { IcpContext } from "../config";
import { ICPCallRejected, ICPCallUnconfirmed, ICPGovernanceRejected } from "../errors";
import { deriveAddressFromPubkey } from "../logic/crypto";
import type { IcpStakingIntent } from "../logic/intent";
import { decodeCanisterIdlArgs, getCanisterIdlFunc, governanceIdlFactory } from "../network/candid";
import { createApi } from "./index";

// Only the network is replaced: the node's HTTP answers, the BLS check of its certificates, and the
// root key the agent would fetch. Submission, polling and every decode run for real.
jest.mock("@icp-sdk/core/agent", () => ({
  ...jest.requireActual("@icp-sdk/core/agent"),
  Certificate: { create: jest.fn() },
}));
jest.mock("../network/agent", () => ({
  getAgent: jest.fn().mockResolvedValue({ rootKey: new Uint8Array(0) }),
}));

const mockCertificate = jest.mocked(Certificate.create);
const mockFetch = jest.fn();

const context = {} as IcpContext;
const manageNeuron = getCanisterIdlFunc(governanceIdlFactory, "manage_neuron");
const identity = Secp256k1KeyIdentity.generate(new Uint8Array(32).fill(7));
const PUBKEY = Buffer.from(identity.getPublicKey().toRaw()).toString("hex");

type Content = Record<string, unknown>;
type Envelope = { content: Content; sender_sig: Uint8Array };

const signatureOver = async (content: Content): Promise<Buffer> =>
  Buffer.from(
    await identity.sign(new Uint8Array([...IC_REQUEST_DOMAIN_SEPARATOR, ...requestIdOf(content)])),
  );

// What the device does with the crafted blob: one signature per request id, call first.
const sign = async (crafted: string): Promise<string> => {
  const { call, read_state } = Cbor.decode<{ call: Content; read_state: Content }>(
    Buffer.from(crafted, "hex"),
  );
  return Buffer.concat([await signatureOver(call), await signatureOver(read_state)]).toString(
    "hex",
  );
};

const reply = (command: unknown) =>
  new Uint8Array(IDL.encode(manageNeuron.retTypes, [{ command: [command] }]));

// A certificate stating the request's status and, once replied, governance's answer.
const certificate = (status: string, answer?: Uint8Array) =>
  ({
    lookup_path: ([, , leaf]: unknown[]) => {
      if (leaf === "status") return { status: LookupPathStatus.Found, value: Buffer.from(status) };
      if (leaf === "reply" && answer) return { status: LookupPathStatus.Found, value: answer };
      if (leaf === "reject_message")
        return { status: LookupPathStatus.Found, value: Buffer.from("x") };
      return { status: LookupPathStatus.Absent };
    },
  }) as unknown as Certificate;

const answering = (body: unknown) => ({
  status: 200,
  arrayBuffer: async () => Cbor.encode(body),
});
const noAnswer = { status: 202, arrayBuffer: async () => new ArrayBuffer(0) };

const intent = (type: string, fields: Partial<IcpStakingIntent> = {}): IcpStakingIntent => ({
  intentType: "staking",
  type,
  mode: "delegate",
  valAddress: "123",
  sender: deriveAddressFromPubkey(PUBKEY),
  senderPublicKey: PUBKEY,
  recipient: "",
  amount: 0n,
  asset: { type: "native" },
  ...fields,
});

const commands: Array<[string, Partial<IcpStakingIntent>, unknown]> = [
  ["start_dissolving", {}, { Configure: { operation: [{ StartDissolving: {} }] } }],
  [
    "increase_dissolve_delay",
    { data: { type: "neuron", additionalDissolveDelaySeconds: 604_800 } },
    {
      Configure: {
        operation: [{ IncreaseDissolveDelay: { additional_dissolve_delay_seconds: 604_800 } }],
      },
    },
  ],
];

const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
  jest.clearAllMocks();
  mockFetch.mockReset();
});

describe("a neuron command through the API", () => {
  const api = createApi();

  // Validate, estimate, craft, sign and combine, as the generic signing flow does.
  const signed = async (input: IcpStakingIntent): Promise<string> => {
    expect((await api.validateIntent(context, input, [], {})).errors).toEqual({});
    const fees = await api.estimateFees(context, input);
    expect(fees).toEqual({ value: 0n });
    const { transaction } = await api.craftTransaction(context, input, { customFees: fees });
    return api.combine(context, transaction, [await sign(transaction)], { pubkey: PUBKEY });
  };

  const submitted = (index: number) =>
    Cbor.decode<Envelope>(new Uint8Array(mockFetch.mock.calls[index][1].body));

  it.each(commands)("%s is accepted when governance answers it", async (type, fields, expected) => {
    mockCertificate.mockResolvedValue(certificate("replied", reply({ Configure: {} })));
    mockFetch.mockResolvedValue(answering({ status: "replied", certificate: new Uint8Array(1) }));

    const requestId = await api.broadcast(context, await signed(intent(type, fields)));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toMatch(
      /\/api\/v3\/canister\/rrkah-fqaaa-aaaaa-aaaaq-cai\/call$/,
    );
    const call = submitted(0);
    expect(requestId).toBe(Buffer.from(requestIdOf(call.content)).toString("hex"));
    const [arg] = decodeCanisterIdlArgs<[{ command: unknown[] }]>(
      manageNeuron,
      call.content.arg as Uint8Array,
    );
    expect(arg.command).toEqual([expected]);
    expect(Buffer.from(call.sender_sig)).toEqual(await signatureOver(call.content));
  });

  it("follows a call the node does not answer at once with the signed read_state request", async () => {
    mockCertificate.mockResolvedValue(certificate("replied", reply({ Configure: {} })));
    mockFetch
      .mockResolvedValueOnce(noAnswer)
      .mockResolvedValue(answering({ certificate: new Uint8Array(1) }));
    jest.useFakeTimers();

    const tx = await signed(intent("start_dissolving"));
    const attempt = api.broadcast(context, tx);
    await jest.advanceTimersByTimeAsync(1000);

    const call = submitted(0);
    await expect(attempt).resolves.toBe(Buffer.from(requestIdOf(call.content)).toString("hex"));
    expect(mockFetch.mock.calls[1][0]).toMatch(/\/api\/v2\/canister\/.*\/read_state$/);
    const readState = submitted(1);
    expect(readState.content.paths).toEqual([
      [Buffer.from("request_status"), new Uint8Array(requestIdOf(call.content))],
    ]);
    expect(Buffer.from(readState.sender_sig)).toEqual(await signatureOver(readState.content));
  });

  it("reports a command whose outcome stays unknown as unconfirmed, with its request id", async () => {
    mockFetch.mockResolvedValue(noAnswer);
    jest.useFakeTimers();

    const attempt = api.broadcast(context, await signed(intent("start_dissolving"))).catch(e => e);
    for (let i = 0; i < 21; i += 1) await jest.advanceTimersByTimeAsync(1000);

    const error = await attempt;
    expect(error).toBeInstanceOf(ICPCallUnconfirmed);
    expect(error).toMatchObject({
      requestId: Buffer.from(requestIdOf(submitted(0).content)).toString("hex"),
    });
  });

  it("reports governance's refusal", async () => {
    mockCertificate.mockResolvedValue(
      certificate(
        "replied",
        reply({ Error: { error_message: "Neuron not found", error_type: 3 } }),
      ),
    );
    mockFetch.mockResolvedValue(answering({ status: "replied", certificate: new Uint8Array(1) }));

    await expect(
      api.broadcast(context, await signed(intent("start_dissolving"))),
    ).rejects.toBeInstanceOf(ICPGovernanceRejected);
  });

  it("reports a call the node turned away before replication", async () => {
    mockFetch.mockResolvedValue(
      answering({ status: "non_replicated_rejection", reject_message: "invalid signature" }),
    );

    await expect(
      api.broadcast(context, await signed(intent("start_dissolving"))),
    ).rejects.toBeInstanceOf(ICPCallRejected);
  });
});
