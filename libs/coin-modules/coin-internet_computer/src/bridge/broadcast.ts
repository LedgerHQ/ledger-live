import { log } from "@ledgerhq/logs";
import { AccountBridge } from "@ledgerhq/types-live";
import invariant from "invariant";
import {
  broadcastTxn,
  claimOrRefreshNeuronFromAccount,
  decodeListNeuronsReply,
  decodeManageNeuronReply,
  readReplyFromCanister,
  readTransferOutcome,
  throwIfLedgerTransferRefused,
} from "../api";
import type { LedgerTransferOutcome } from "../api";
import { toNeuronsData } from "../common-logic/neuron";
import { MAINNET_GOVERNANCE_CANISTER_ID, MAINNET_LEDGER_CANISTER_ID } from "../consts";
import {
  ICPCallRejected,
  ICPCallUnconfirmed,
  ICPNeuronsNotRead,
  ICPNodeRefused,
  ICPStakeNotRefreshed,
} from "../errors";
import { derivePrincipalFromPubkey } from "../logic/crypto";
import { TRANSFER_TYPES, Transaction } from "../types";

// The transfers that create/refresh a neuron (i.e. every transfer except a plain send); each carries
// the stake nonce so broadcast can claim/refresh it.
const NEURON_TRANSFER_TYPES = new Set<string>([...TRANSFER_TYPES].filter(t => t !== "send"));

interface TransferRawData {
  encodedSignedCallBlob: string;
  transferRequestIdHex: string;
  methodName: string;
  stakeNonce?: string;
}

interface GovernanceRawData {
  encodedSignedCallBlob: string;
  encodedSignedReadStateBlob: string;
  requestId: string;
  methodName: string;
}

const isTransferRawData = (data: unknown): data is TransferRawData =>
  typeof data === "object" &&
  data !== null &&
  typeof (data as TransferRawData).encodedSignedCallBlob === "string" &&
  typeof (data as TransferRawData).transferRequestIdHex === "string" &&
  typeof (data as TransferRawData).methodName === "string";

const isGovernanceRawData = (data: unknown): data is GovernanceRawData =>
  typeof data === "object" &&
  data !== null &&
  typeof (data as GovernanceRawData).encodedSignedCallBlob === "string" &&
  typeof (data as GovernanceRawData).encodedSignedReadStateBlob === "string" &&
  typeof (data as GovernanceRawData).requestId === "string" &&
  typeof (data as GovernanceRawData).methodName === "string";

// An error that already says what became of the transfer — the node never took it, the replica did
// not run it, or the outcome is unknown and reported as such — as opposed to one that says only
// that this attempt to find out failed.
const isVerdict = (error: unknown): boolean =>
  error instanceof ICPNodeRefused ||
  error instanceof ICPCallRejected ||
  error instanceof ICPCallUnconfirmed;

/**
 * Submit the signed ledger transfer and check that the ledger accepted it.
 *
 * Only a certified answer that can be read settles the question either way. Without one — the node
 * answered 202 or 5xx, the connection dropped, or what came back would not decode or verify — the
 * transfer may still go through, and reporting a failure makes the account read as though nothing
 * moved. For a neuron transfer that means offering the stake again with a fresh nonce: a second
 * neuron, not a claim of the first. So it is reported as unconfirmed, and the app records the stake
 * until a sync says. A plain send keeps the failure it has always reported; its flow is not this
 * module's to change. A refusal settles it the other way — the node never took the message, the
 * replica did not run it, or the ledger itself refused the transfer — and stays a failure for both.
 */
const submitTransfer = async (rawData: TransferRawData): Promise<void> => {
  const neuronTransfer = NEURON_TRANSFER_TYPES.has(rawData.methodName);
  let outcome: LedgerTransferOutcome;
  try {
    const callResponse = await broadcastTxn(
      Buffer.from(rawData.encodedSignedCallBlob, "hex"),
      MAINNET_LEDGER_CANISTER_ID,
      "call",
    );
    if (!callResponse) {
      if (neuronTransfer) throw new ICPCallUnconfirmed();
      throw new Error("Failed to broadcast transaction: the node returned no certificate");
    }
    outcome = await readTransferOutcome(callResponse, rawData.transferRequestIdHex);
  } catch (error) {
    if (!neuronTransfer || isVerdict(error)) throw error;
    throw new ICPCallUnconfirmed("ICPCallUnconfirmed", { cause: error });
  }
  throwIfLedgerTransferRefused(outcome);
};

/**
 * Claim or refresh the neuron behind a transfer that has already settled, returning its id.
 *
 * From here on nothing is a failed transaction: the ICP has left the account whatever the claim
 * did. A claim governance or the network refused says so itself (ICPStakeNotRefreshed). Anything
 * else that fails on the way to a verdict — the connection dropped, a certificate that did not
 * verify, a reply that would not decode — leaves the outcome unknown, which is what an exhausted
 * poll already reports and what ICPCallUnconfirmed means; the failure rides along as `cause`. Left
 * generic, the app would take it for a transfer that never happened and offer the stake again.
 */
const claimSettledTransfer = async (
  xpub: string | undefined,
  stakeNonce: string | undefined,
): Promise<bigint> => {
  try {
    invariant(xpub, "[ICP](broadcast) Account xpub is required to claim the neuron");
    invariant(stakeNonce, "[ICP](broadcast) Stake nonce is required to claim the neuron");
    const controller = derivePrincipalFromPubkey(xpub);
    const neuronId = await claimOrRefreshNeuronFromAccount(controller, BigInt(stakeNonce));
    // The transfer settled but the claim couldn't be confirmed: don't report the composite staking
    // op as successful. The transfer is in history and the nonce is recoverable, so the neuron can
    // be claimed/refreshed later (idempotent) — but this attempt is unconfirmed, not done.
    if (neuronId === undefined) throw new ICPCallUnconfirmed();
    return neuronId;
  } catch (error) {
    if (error instanceof ICPStakeNotRefreshed || error instanceof ICPCallUnconfirmed) throw error;
    throw new ICPCallUnconfirmed("ICPCallUnconfirmed", { cause: error });
  }
};

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation: { operation, rawData },
}) => {
  log("debug", "[broadcast] Internet Computer transaction broadcast initiated");
  invariant(operation.extra, "[ICP](broadcast) Missing operation extra");

  // Ledger-canister transfer (plain send, neuron creation, neuron top-up).
  if (isTransferRawData(rawData)) {
    await submitTransfer(rawData);

    // Creation and top-up complete by claiming/refreshing the neuron from the settled transfer.
    if (NEURON_TRANSFER_TYPES.has(rawData.methodName)) {
      const neuronId = await claimSettledTransfer(account.xpub, rawData.stakeNonce);
      if (rawData.methodName === "create_neuron") {
        return {
          ...operation,
          extra: { ...operation.extra, createdNeuronId: neuronId.toString() },
        };
      }
    }
    return operation;
  }

  // Governance update call (manage_neuron commands and list_neurons).
  invariant(isGovernanceRawData(rawData), "[ICP](broadcast) Invalid rawData format");
  const reply = await readReplyFromCanister(
    Buffer.from(rawData.encodedSignedCallBlob, "hex"),
    Buffer.from(rawData.encodedSignedReadStateBlob, "hex"),
    MAINNET_GOVERNANCE_CANISTER_ID,
    rawData.requestId,
  );

  if (rawData.methodName === "list_neurons") {
    // A read with no reply read nothing. Returning the operation would report the refresh as done
    // while the snapshot is untouched, so the user spends a signature and is told their neurons are
    // up to date. Nothing changed and the read is idempotent, so this one is safe to ask again.
    if (!reply) throw new ICPNeuronsNotRead();
    const neurons = toNeuronsData(decodeListNeuronsReply(reply)).fullNeurons;
    return { ...operation, extra: { ...operation.extra, neurons } };
  }

  // A manage_neuron op is confirmed by its certified reply (or a subsequent neuron refresh), NOT by
  // ledger sync — governance calls never appear in the account's transaction history. So an
  // indeterminate result must not be reported as a successful broadcast: that could strand the op or
  // invite a retry that double-executes a non-idempotent command (split/spawn/disburse).
  if (!reply) throw new ICPCallUnconfirmed();
  // A command that computed its own result says so in the reply; carrying it lets the neuron be
  // brought up to date from figures the canister stated, instead of ones the app guessed at.
  const outcome = decodeManageNeuronReply(reply);
  return outcome ? { ...operation, extra: { ...operation.extra, outcome } } : operation;
};
