import {
  Cbor,
  Certificate,
  IC_REQUEST_DOMAIN_SEPARATOR,
  LookupPathStatus,
  requestIdOf,
} from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { Secp256k1KeyIdentity } from "@icp-sdk/core/identity/secp256k1";
import { Principal } from "@icp-sdk/core/principal";
import type { IcpContext } from "../config";
import { MIN_NEURON_STAKE, NNS_MINIMUM_DISSOLVE_DELAY, TRANSFER_FEE } from "../consts";
import { ICPCallRejected, ICPCallUnconfirmed, ICPGovernanceRejected } from "../errors";
import { deriveAddressFromPubkey } from "../logic/crypto";
import type { IcpNeuronCommandData, IcpStakingIntent } from "../logic/intent";
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

const NOW_SECONDS = 1_750_760_220;
const HOT_KEY = Principal.fromUint8Array(new Uint8Array([1, 2, 3]));
const SPLIT = BigInt(MIN_NEURON_STAKE) + TRANSFER_FEE;
const NEW_NEURON = { created_neuron_id: [{ id: 456n }] };

const data = (fields: Omit<IcpNeuronCommandData, "type">) => ({
  data: { type: "neuron" as const, ...fields },
});
const configure = (operation: unknown) => ({ Configure: { operation: [operation] } });

// Each command: the intent fields, the command governance receives, and governance's answer.
const commands: Array<[string, Partial<IcpStakingIntent>, unknown, unknown]> = [
  ["start_dissolving", {}, configure({ StartDissolving: {} }), { Configure: {} }],
  ["stop_dissolving", {}, configure({ StopDissolving: {} }), { Configure: {} }],
  [
    "increase_dissolve_delay",
    data({ additionalDissolveDelaySeconds: 604_800 }),
    configure({ IncreaseDissolveDelay: { additional_dissolve_delay_seconds: 604_800 } }),
    { Configure: {} },
  ],
  [
    "set_dissolve_delay",
    data({ dissolveDelaySeconds: NNS_MINIMUM_DISSOLVE_DELAY }),
    configure({
      SetDissolveTimestamp: {
        dissolve_timestamp_seconds: BigInt(NOW_SECONDS + NNS_MINIMUM_DISSOLVE_DELAY),
      },
    }),
    { Configure: {} },
  ],
  [
    "add_hot_key",
    data({ hotKey: HOT_KEY.toText() }),
    configure({ AddHotKey: { new_hot_key: [HOT_KEY] } }),
    { Configure: {} },
  ],
  [
    "remove_hot_key",
    data({ hotKey: HOT_KEY.toText() }),
    configure({ RemoveHotKey: { hot_key_to_remove: [HOT_KEY] } }),
    { Configure: {} },
  ],
  [
    "auto_stake_maturity",
    data({ autoStakeMaturity: true }),
    configure({ ChangeAutoStakeMaturity: { requested_setting_for_auto_stake_maturity: true } }),
    { Configure: {} },
  ],
  [
    "disburse",
    {},
    { Disburse: { to_account: [], amount: [] } },
    { Disburse: { transfer_block_height: 1n } },
  ],
  ["refresh_voting_power", {}, { RefreshVotingPower: {} }, { RefreshVotingPower: {} }],
  [
    "stake_maturity",
    data({ percentage: 50 }),
    { StakeMaturity: { percentage_to_stake: [50] } },
    { StakeMaturity: { maturity_e8s: 0n, staked_maturity_e8s: 1n } },
  ],
  [
    "spawn_neuron",
    data({ percentage: 100 }),
    { Spawn: { percentage_to_spawn: [100], new_controller: [], nonce: [] } },
    { Spawn: NEW_NEURON },
  ],
  [
    "spawn_neuron_from_maturity",
    {},
    { Spawn: { percentage_to_spawn: [], new_controller: [], nonce: [] } },
    { Spawn: NEW_NEURON },
  ],
  // The canister reads the field the device cannot parse, `memo`, as absent.
  [
    "split_neuron",
    { amount: SPLIT },
    { Split: { amount_e8s: SPLIT, memo: [] } },
    { Split: NEW_NEURON },
  ],
  [
    "follow",
    data({ followTopic: "Governance", followeeIds: ["456"] }),
    { Follow: { topic: 4, followees: [{ id: 456n }] } },
    { Follow: {} },
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

  it.each(commands)(
    "%s is accepted when governance answers it",
    async (type, fields, expected, answer) => {
      // The dissolve timestamp is the delay from now; nothing here waits on a timer.
      jest.useFakeTimers({ now: NOW_SECONDS * 1000 });
      mockCertificate.mockResolvedValue(certificate("replied", reply(answer)));
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
    },
  );

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
