import { Cbor, requestIdOf } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { MAINNET_GOVERNANCE_CANISTER_ID, MAINNET_LEDGER_CANISTER_ID } from "../consts";
import {
  ICPCallRejected,
  ICPCallUnconfirmed,
  ICPGovernanceRejected,
  ICPNodeRefused,
  ICPTransactionExpired,
} from "../errors";
import {
  decodeCanisterIdlArgs,
  decodeCanisterIdlFunc,
  getCanisterIdlFunc,
  governanceIdlFactory,
  ledgerIdlFactory,
} from "../network/candid";
import {
  broadcastTxn,
  decodeManageNeuronReply,
  readReplyFromCanister,
  readTransferOutcome,
  throwIfLedgerTransferRefused,
} from "../network/api";
import { AccountIdentifier } from "./accountIdentifier";
import type { TransferRawRequest } from "./buildTransaction";
import type { DecodedCallContent, DecodedReadStateContent } from "./combine";
import { hashTransaction } from "./hashTransaction";

const NANOS_PER_MILLI = 1_000_000n;

/** A transfer argument as any signer may have built it: both Candid options can be empty. */
type DecodedTransferRequest = Omit<TransferRawRequest, "created_at_time" | "from_subaccount"> & {
  created_at_time: [] | [{ timestamp_nanos: bigint }];
  from_subaccount: [] | [Uint8Array];
};

/**
 * The ledger transaction hash of the transfer the call makes, as `listOperations` reports it.
 * Computed before submitting, so a transfer it cannot describe is refused before any funds move.
 */
function transferHash(content: DecodedCallContent): string {
  const [request] = decodeCanisterIdlArgs<[DecodedTransferRequest]>(
    getCanisterIdlFunc(ledgerIdlFactory, "transfer"),
    content.arg,
  );
  // `listOperations` reads the principal's default account only.
  if (request.from_subaccount.length > 0) {
    throw new Error("[ICP](broadcast) Transfers from a subaccount are not supported");
  }
  const [createdAt] = request.created_at_time;
  if (!createdAt) throw new Error("[ICP](broadcast) The transfer has no created_at_time");

  const principal = Principal.fromUint8Array(content.sender);
  return hashTransaction({
    from: AccountIdentifier.fromPrincipal({ principal }).toHex(),
    to: Buffer.from(request.to).toString("hex"),
    amount: request.amount.e8s,
    fee: request.fee.e8s,
    memo: request.memo,
    created_at_time: createdAt.timestamp_nanos,
  });
}

interface SignedNeuronCommand {
  call: { content: DecodedCallContent };
  read_state: { content: DecodedReadStateContent };
}

const isSignedNeuronCommand = (decoded: object): decoded is SignedNeuronCommand =>
  "call" in decoded && "read_state" in decoded;

const CALLS = {
  "ledger transfer": { canisterId: MAINNET_LEDGER_CANISTER_ID, methodName: "transfer" },
  "neuron command": { canisterId: MAINNET_GOVERNANCE_CANISTER_ID, methodName: "manage_neuron" },
} as const;

const requireCall = (content: DecodedCallContent, kind: keyof typeof CALLS): void => {
  const { canisterId, methodName } = CALLS[kind];
  const target = Principal.fromUint8Array(content.canister_id).toText();
  if (target !== canisterId || content.method_name !== methodName) {
    throw new Error(`[ICP](broadcast) Not a ${kind}: ${target}.${content.method_name}`);
  }
};

const refuseExpired = (content: DecodedCallContent): void => {
  const expiresAt = Number(content.ingress_expiry / NANOS_PER_MILLI);
  if (expiresAt <= Date.now()) throw new ICPTransactionExpired(undefined, { expiresAt });
};

/** A manage_neuron request or response: both carry the command as an optional variant. */
type ManageNeuronMessage = { command: [] | [Record<string, unknown>] };

const manageNeuron = () => getCanisterIdlFunc(governanceIdlFactory, "manage_neuron");

const commandName = ({ command: [variant] }: ManageNeuronMessage): string | undefined =>
  variant ? Object.keys(variant)[0] : undefined;

// An error that says what became of the command: the node never took it, the replica did not run
// it, or governance refused it. Any other failure leaves the outcome unknown.
const isVerdict = (error: unknown): boolean =>
  error instanceof ICPNodeRefused ||
  error instanceof ICPCallRejected ||
  error instanceof ICPGovernanceRejected;

/**
 * Submit a signed neuron command and return its request id once governance accepts it.
 *
 * Without a terminal reply the command may still run, and a recrafted one gets a new request id, so
 * an increase or a split could apply twice. That outcome is reported as ICPCallUnconfirmed, which
 * carries the request id, never as an ordinary failure.
 */
async function broadcastNeuronCommand({ call, read_state }: SignedNeuronCommand): Promise<string> {
  requireCall(call.content, "neuron command");
  refuseExpired(call.content);
  const requestId = Buffer.from(requestIdOf(call.content));
  const requestIdHex = requestId.toString("hex");
  // Polling another request's status could read its reply as this command's.
  const polled = read_state.content.paths[0]?.[1];
  if (!polled || !requestId.equals(Buffer.from(polled))) {
    throw new Error("[ICP](broadcast) The read_state request does not poll this call");
  }

  const [request] = decodeCanisterIdlArgs<[ManageNeuronMessage]>(manageNeuron(), call.content.arg);
  const requested = commandName(request);

  let answered: string | undefined;
  try {
    const reply = await readReplyFromCanister(
      Buffer.from(Cbor.encode(call)),
      Buffer.from(Cbor.encode(read_state)),
      MAINNET_GOVERNANCE_CANISTER_ID,
      requestIdHex,
    );
    if (reply) {
      decodeManageNeuronReply(reply);
      answered = commandName(
        decodeCanisterIdlFunc<[ManageNeuronMessage]>(manageNeuron(), reply)[0],
      );
    }
  } catch (error) {
    if (isVerdict(error)) throw error;
    throw new ICPCallUnconfirmed("ICPCallUnconfirmed", { requestId: requestIdHex, cause: error });
  }
  // Governance answers a command it ran with the response of the same name. No reply, or another
  // answer, does not confirm this one.
  if (!requested || answered !== requested) {
    throw new ICPCallUnconfirmed("ICPCallUnconfirmed", { requestId: requestIdHex });
  }
  return requestIdHex;
}

/**
 * Submit a signed ledger transfer or neuron command. A transfer returns its transaction hash once
 * the ledger accepts it; a neuron command returns its request id once governance accepts it.
 *
 * For a transfer, only a certified reply settles the outcome. Without one, the call can still
 * execute, but no signed read-state request exists to poll its status, so the broadcast fails as the
 * account bridge does.
 */
export async function broadcast(tx: string): Promise<string> {
  const envelope = Buffer.from(tx, "hex");
  const decoded = Cbor.decode<{ content: DecodedCallContent } | SignedNeuronCommand>(envelope);
  if (isSignedNeuronCommand(decoded)) return broadcastNeuronCommand(decoded);

  const { content } = decoded;
  requireCall(content, "ledger transfer");
  refuseExpired(content);
  const hash = transferHash(content);

  const callResponse = await broadcastTxn(envelope, MAINNET_LEDGER_CANISTER_ID, "call");
  if (!callResponse) {
    throw new Error("[ICP](broadcast) The node returned no certificate");
  }
  const requestIdHex = Buffer.from(requestIdOf(content)).toString("hex");
  throwIfLedgerTransferRefused(await readTransferOutcome(callResponse, requestIdHex));

  return hash;
}
