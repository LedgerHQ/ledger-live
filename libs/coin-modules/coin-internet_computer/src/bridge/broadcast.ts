import { log } from "@ledgerhq/logs";
import { AccountBridge } from "@ledgerhq/types-live";
import invariant from "invariant";
import {
  broadcastTxn,
  claimOrRefreshNeuronFromAccount,
  decodeListNeuronsReply,
  decodeManageNeuronReply,
  ensureTransferCallAccepted,
  readReplyFromCanister,
} from "../api";
import { toNeuronsData } from "../common-logic/neuron";
import { MAINNET_GOVERNANCE_CANISTER_ID, MAINNET_LEDGER_CANISTER_ID } from "../consts";
import { ICPCallUnconfirmed, ICPNeuronsNotRead } from "../errors";
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

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation: { operation, rawData },
}) => {
  log("debug", "[broadcast] Internet Computer transaction broadcast initiated");
  invariant(operation.extra, "[ICP](broadcast) Missing operation extra");

  // Ledger-canister transfer (plain send, neuron creation, neuron top-up).
  if (isTransferRawData(rawData)) {
    const callResponse = await broadcastTxn(
      Buffer.from(rawData.encodedSignedCallBlob, "hex"),
      MAINNET_LEDGER_CANISTER_ID,
      "call",
    );
    await ensureTransferCallAccepted(callResponse, rawData.transferRequestIdHex);

    // Creation and top-up complete by claiming/refreshing the neuron from the settled transfer.
    if (NEURON_TRANSFER_TYPES.has(rawData.methodName)) {
      invariant(account.xpub, "[ICP](broadcast) Account xpub is required to claim the neuron");
      invariant(rawData.stakeNonce, "[ICP](broadcast) Stake nonce is required to claim the neuron");
      const controller = derivePrincipalFromPubkey(account.xpub);
      const neuronId = await claimOrRefreshNeuronFromAccount(
        controller,
        BigInt(rawData.stakeNonce),
      );
      // The transfer settled but the claim couldn't be confirmed: don't report the composite staking
      // op as successful. The transfer is in history and the nonce is recoverable, so the neuron can
      // be claimed/refreshed later (idempotent) — but this attempt is unconfirmed, not done.
      if (neuronId === undefined) throw new ICPCallUnconfirmed();
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
