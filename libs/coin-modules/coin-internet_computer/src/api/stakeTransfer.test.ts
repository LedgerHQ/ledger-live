import {
  Cbor,
  Certificate,
  HttpAgent,
  IC_REQUEST_DOMAIN_SEPARATOR,
  LookupPathStatus,
  requestIdOf,
} from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";
import { Secp256k1KeyIdentity } from "@icp-sdk/core/identity/secp256k1";
import { Principal } from "@icp-sdk/core/principal";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { IcpContext } from "../config";
import { MAINNET_GOVERNANCE_CANISTER_ID, MIN_NEURON_STAKE, TRANSFER_FEE } from "../consts";
import { ICPStakeNotRefreshed } from "../errors";
import { getNeuronStakeSubAccountIdentifier } from "../logic/buildNeuronTransaction";
import { deriveAddressFromPubkey } from "../logic/crypto";
import { hashTransaction } from "../logic/hashTransaction";
import type { IcpStakingIntent } from "../logic/intent";
import {
  decodeCanisterIdlArgs,
  getCanisterIdlFunc,
  governanceIdlFactory,
  ledgerIdlFactory,
} from "../network/candid";
import { createApi, refreshNeuronStake } from "./index";

// The network is served by MSW. Two crypto checks are replaced, since no test key can satisfy them:
// the BLS signature of a certificate (its decoding and verification are covered with recorded
// certificates in readTransferOutcome.certificate.test.ts), and the node signatures of a query
// reply, which the agent built here does not check.
jest.mock("@icp-sdk/core/agent", () => ({
  ...jest.requireActual("@icp-sdk/core/agent"),
  Certificate: { create: jest.fn() },
}));
jest.mock("../network/agent", () => ({
  getAgent: (host: string) => HttpAgent.create({ host, verifyQuerySignatures: false }),
}));

const mockCertificate = jest.mocked(Certificate.create);

const context = {} as IcpContext;
const transferFunc = getCanisterIdlFunc(ledgerIdlFactory, "transfer");
const claimFunc = getCanisterIdlFunc(governanceIdlFactory, "claim_or_refresh_neuron_from_account");
const listNeuronsFunc = getCanisterIdlFunc(governanceIdlFactory, "list_neurons");
const balanceFunc = getCanisterIdlFunc(ledgerIdlFactory, "account_balance");
const identity = Secp256k1KeyIdentity.generate(new Uint8Array(32).fill(7));
const PUBKEY = Buffer.from(identity.getPublicKey().toRaw()).toString("hex");
const CONTROLLER = identity.getPrincipal();
const SENDER = deriveAddressFromPubkey(PUBKEY);
const NONCE = 42n;
const STAKE_ACCOUNT = getNeuronStakeSubAccountIdentifier(CONTROLLER, NONCE);
const STAKE = BigInt(MIN_NEURON_STAKE);
const NOW = 1_750_760_220_000;

type Content = Record<string, unknown> & {
  arg: Uint8Array;
  sender: Uint8Array;
  method_name: string;
  request_type: string;
};
type Envelope = { content: Content; sender_sig?: Uint8Array };

const signatureOver = async (content: Record<string, unknown>): Promise<Buffer> =>
  Buffer.from(
    await identity.sign(new Uint8Array([...IC_REQUEST_DOMAIN_SEPARATOR, ...requestIdOf(content)])),
  );

// What the device does with the crafted blob: it signs the transfer, never the nonce.
const sign = async (crafted: string): Promise<string> => {
  const { content } = Cbor.decode<{ content: Record<string, unknown> }>(
    Buffer.from(crafted, "hex"),
  );
  return (await signatureOver(content)).toString("hex");
};

// A certificate stating the request's status and the canister's answer.
const certificate = (answer: Uint8Array) =>
  ({
    lookup_path: ([, , leaf]: unknown[]) => {
      if (leaf === "status")
        return { status: LookupPathStatus.Found, value: Buffer.from("replied") };
      if (leaf === "reply") return { status: LookupPathStatus.Found, value: answer };
      return { status: LookupPathStatus.Absent };
    },
  }) as unknown as Certificate;

const transferred = certificate(new Uint8Array(IDL.encode(transferFunc.retTypes, [{ Ok: 7n }])));
const claimed = (result: unknown) =>
  certificate(new Uint8Array(IDL.encode(claimFunc.retTypes, [{ result: [result] }])));

// The public information governance lists for a neuron; only its id matters here.
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

/** What governance and the index say about the stake account. */
let stakeAccount: { neuronId: bigint | undefined; balance: bigint };

const queryReply = (method: string): Uint8Array => {
  if (method === "list_neurons") {
    const { neuronId } = stakeAccount;
    return new Uint8Array(
      IDL.encode(listNeuronsFunc.retTypes, [
        {
          neuron_infos: neuronId === undefined ? [] : [[neuronId, NEURON_INFO]],
          full_neurons: [],
          total_pages_available: [],
        },
      ]),
    );
  }
  if (method === "account_balance") {
    return new Uint8Array(IDL.encode(balanceFunc.retTypes, [{ e8s: stakeAccount.balance }]));
  }
  throw new Error(`Unexpected query: ${method}`);
};

/** The update calls the node received, in order. */
let calls: Envelope[];

const cbor = (body: unknown) =>
  new HttpResponse(Buffer.from(Cbor.encode(body)), {
    headers: { "Content-Type": "application/cbor" },
  });

const server = setupServer(
  http.post(
    /^https:\/\/ic0\.app\/api\/v\d\/canister\/[^/]+\/(call|query)$/,
    async ({ request }) => {
      const envelope = Cbor.decode<Envelope>(new Uint8Array(await request.arrayBuffer()));
      if (envelope.content.request_type === "query") {
        return cbor({
          status: "replied",
          reply: { arg: queryReply(envelope.content.method_name) },
        });
      }
      calls.push(envelope);
      return cbor({ status: "replied", certificate: new Uint8Array(1) });
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
beforeEach(() => {
  jest.useFakeTimers({ now: NOW, advanceTimers: true });
  calls = [];
  stakeAccount = { neuronId: undefined, balance: 0n };
});
afterEach(() => {
  server.resetHandlers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe("a stake transfer through the API", () => {
  const api = createApi();

  // Validate, estimate, craft, sign and combine, as the generic signing flow does.
  const signed = async (input: IcpStakingIntent): Promise<string> => {
    const balances = [{ value: 10n * STAKE, asset: { type: "native" as const } }];
    expect((await api.validateIntent(context, input, balances, {})).errors).toEqual({});
    const fees = await api.estimateFees(context, input);
    expect(fees).toEqual({ value: TRANSFER_FEE });
    const { transaction } = await api.craftTransaction(context, input, { customFees: fees });
    return api.combine(context, transaction, [await sign(transaction)], { pubkey: PUBKEY });
  };

  const intent = (type: string): IcpStakingIntent => ({
    intentType: "staking",
    type,
    mode: "delegate",
    valAddress: type === "create_neuron" ? MAINNET_GOVERNANCE_CANISTER_ID : "123",
    sender: SENDER,
    senderPublicKey: PUBKEY,
    recipient: STAKE_ACCOUNT,
    amount: STAKE,
    asset: { type: "native" },
    data: { type: "neuron", stakeNonce: String(NONCE) },
  });

  it.each([
    ["create_neuron", NONCE, { neuronId: undefined, balance: 0n }],
    ["increase_stake", 0n, { neuronId: 123n, balance: STAKE }],
  ])("%s transfers the stake, then claims its neuron", async (type, memo, account) => {
    stakeAccount = account;
    mockCertificate
      .mockResolvedValueOnce(transferred)
      .mockResolvedValueOnce(claimed({ NeuronId: { id: 123n } }));

    const hash = await api.broadcast(context, await signed(intent(type)));

    expect(hash).toBe(
      hashTransaction({
        from: SENDER,
        to: STAKE_ACCOUNT,
        amount: STAKE,
        fee: TRANSFER_FEE,
        memo,
        created_at_time: BigInt(NOW) * 1_000_000n,
      }),
    );
    expect(calls).toHaveLength(2);
    const [transfer, claim] = calls;
    expect(transfer.content.method_name).toBe("transfer");
    expect(Buffer.from(transfer.sender_sig!)).toEqual(await signatureOver(transfer.content));
    const [request] = decodeCanisterIdlArgs<[{ to: Uint8Array; memo: bigint }]>(
      transferFunc,
      transfer.content.arg,
    );
    expect(Buffer.from(request.to).toString("hex")).toBe(STAKE_ACCOUNT);
    expect(request.memo).toBe(memo);

    expect(Principal.fromUint8Array(claim.content.sender).isAnonymous()).toBe(true);
    expect(decodeCanisterIdlArgs(claimFunc, claim.content.arg)).toEqual([
      { controller: [CONTROLLER], memo: NONCE },
    ]);
  });

  it("refuses a top-up of another neuron before signing", async () => {
    stakeAccount = { neuronId: 456n, balance: STAKE };

    const { errors } = await api.validateIntent(context, intent("increase_stake"), [
      { value: 10n * STAKE, asset: { type: "native" } },
    ]);

    expect(errors.transaction?.message).toMatch(/names neuron 456, not 123/);
  });

  it("reports a refused claim with the settled transfer, which the claim alone then recovers", async () => {
    mockCertificate
      .mockResolvedValueOnce(transferred)
      .mockResolvedValueOnce(claimed({ Error: { error_message: "busy", error_type: 1 } }));

    const error = await api.broadcast(context, await signed(intent("create_neuron"))).catch(e => e);

    expect(error).toBeInstanceOf(ICPStakeNotRefreshed);
    expect(error).toMatchObject({ stakeNonce: String(NONCE), reason: "busy" });
    expect(error.transactionHash).toMatch(/^[\da-f]{64}$/);

    calls = [];
    mockCertificate.mockResolvedValueOnce(claimed({ NeuronId: { id: 123n } }));

    await expect(refreshNeuronStake(CONTROLLER.toText(), error.stakeNonce)).resolves.toBe("123");
    expect(calls).toHaveLength(1);
    expect(decodeCanisterIdlArgs(claimFunc, calls[0].content.arg)).toEqual([
      { controller: [CONTROLLER], memo: NONCE },
    ]);
  });
});
