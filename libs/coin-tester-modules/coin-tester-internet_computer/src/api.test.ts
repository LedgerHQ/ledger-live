import console from "console";
import { Cbor } from "@icp-sdk/core/agent";
import { createApi } from "@ledgerhq/coin-internet_computer/api/index";
import {
  MAINNET_GOVERNANCE_CANISTER_ID,
  TRANSFER_FEE,
} from "@ledgerhq/coin-internet_computer/consts";
import {
  getNeuronStakeSubAccount,
  getNeuronStakeSubAccountIdentifier,
} from "@ledgerhq/coin-internet_computer/logic/buildNeuronTransaction";
import { derivePrincipalFromPubkey } from "@ledgerhq/coin-internet_computer/logic/crypto";
import type { IcpIntent } from "@ledgerhq/coin-internet_computer/logic/intent";
import { forbidRemoteRequests } from "@ledgerhq/coin-tester/localOnly";
import { ACCOUNT_INDICES, E8S_PER_ICP, localContext, pathAt } from "./fixtures";
import { fund, listNeuronsOf, neuronIdOf, waitForIndexedBalance } from "./network";
import { addressAt, buildSigner, publicKeyAt } from "./signer";

global.console = console;
jest.setTimeout(600_000);

const FUNDING = 10n * E8S_PER_ICP;
const SENT = E8S_PER_ICP;
const STAKE = 2n * E8S_PER_ICP;
const TOP_UP = E8S_PER_ICP;
const STAKE_NONCE = 7n;

const api = createApi();
const signer = buildSigner();

const PATH = pathAt(ACCOUNT_INDICES.api.sender);
const PUBLIC_KEY = publicKeyAt(PATH);
const SENDER = addressAt(PATH);
const RECIPIENT = addressAt(pathAt(ACCOUNT_INDICES.api.recipient));
const CONTROLLER = derivePrincipalFromPubkey(PUBLIC_KEY);
const STAKE_ACCOUNT = getNeuronStakeSubAccountIdentifier(CONTROLLER, STAKE_NONCE);

const sendIntent = (): IcpIntent =>
  ({
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    senderPublicKey: PUBLIC_KEY,
    recipient: RECIPIENT,
    amount: SENT,
    asset: { type: "native" },
  }) as IcpIntent;

const stakeIntent = (
  type: "create_neuron" | "increase_stake",
  valAddress: string,
  amount: bigint,
): IcpIntent =>
  ({
    intentType: "staking",
    type,
    mode: "delegate",
    valAddress,
    sender: SENDER,
    senderPublicKey: PUBLIC_KEY,
    recipient: STAKE_ACCOUNT,
    amount,
    asset: { type: "native" },
    data: { type: "neuron", stakeNonce: STAKE_NONCE.toString() },
  }) as IcpIntent;

/**
 * Validates, crafts, signs, combines and broadcasts the intent. The device signs `{ content }`
 * only: a stake transfer's crafted container also carries the unsigned nonce.
 */
async function submit(intent: IcpIntent): Promise<string> {
  const balances = await api.getBalance(localContext, SENDER);
  const validation = await api.validateIntent(localContext, intent, balances);
  expect(validation.errors).toEqual({});

  const { transaction } = await api.craftTransaction(localContext, intent);
  const { content } = Cbor.decode<{ content: Record<string, unknown> }>(
    Buffer.from(transaction, "hex"),
  );
  const { signatureRS } = await signer.sign(
    PATH,
    Buffer.from(Cbor.encode({ content })),
    intent.type === "create_neuron",
  );
  const signed = api.combine(localContext, transaction, [signatureRS!.toString("hex")], {
    pubkey: PUBLIC_KEY,
  });
  return api.broadcast(localContext, signed);
}

async function stakedNeuron() {
  const subaccount = Buffer.from(getNeuronStakeSubAccount(CONTROLLER, STAKE_NONCE));
  const neurons = await listNeuronsOf(PATH);
  const neuron = neurons.find(n => Buffer.from(n.account).equals(subaccount));
  expect(neuron).toBeDefined();
  expect(neuron!.controller[0]?.toText()).toBe(CONTROLLER.toText());
  return neuron!;
}

describe("Internet Computer CoinModuleApi against the local network", () => {
  let closeGuard: () => void;
  let balance = FUNDING;

  beforeAll(async () => {
    closeGuard = forbidRemoteRequests();
    await fund(SENDER, FUNDING);
  });

  afterAll(() => closeGuard?.());

  it("sends ICP", async () => {
    const hash = await submit(sendIntent());

    balance -= SENT + TRANSFER_FEE;
    await waitForIndexedBalance(SENDER, balance);
    await waitForIndexedBalance(RECIPIENT, SENT);
    const { items } = await api.listOperations(localContext, SENDER, { minHeight: 0 });
    const sent = items.find(op => op.tx.hash === hash && op.type === "OUT");
    expect(sent).toMatchObject({ value: SENT, recipients: [RECIPIENT] });
    expect(sent?.tx.fees).toBe(TRANSFER_FEE);
  });

  let neuronId: string | undefined;

  it("creates a neuron with a stake transfer", async () => {
    await submit(stakeIntent("create_neuron", MAINNET_GOVERNANCE_CANISTER_ID, STAKE));

    balance -= STAKE + TRANSFER_FEE;
    await waitForIndexedBalance(SENDER, balance);
    const neuron = await stakedNeuron();
    expect(neuron.cached_neuron_stake_e8s).toBe(STAKE);
    neuronId = neuronIdOf(neuron);
    expect(neuronId).toMatch(/^\d+$/);
  });

  it("increases the neuron's stake with a stake transfer", async () => {
    expect(neuronId).toBeDefined();
    await submit(stakeIntent("increase_stake", neuronId!, TOP_UP));

    balance -= TOP_UP + TRANSFER_FEE;
    await waitForIndexedBalance(SENDER, balance);
    const neuron = await stakedNeuron();
    expect(neuronIdOf(neuron)).toBe(neuronId);
    expect(neuron.cached_neuron_stake_e8s).toBe(STAKE + TOP_UP);
  });
});
