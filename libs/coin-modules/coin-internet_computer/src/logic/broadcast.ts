import { Cbor, requestIdOf } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { MAINNET_LEDGER_CANISTER_ID } from "../consts";
import { ICPTransactionExpired } from "../errors";
import { decodeCanisterIdlArgs, getCanisterIdlFunc, ledgerIdlFactory } from "../network/candid";
import { broadcastTxn, readTransferOutcome, throwIfLedgerTransferRefused } from "../network/api";
import { AccountIdentifier } from "./accountIdentifier";
import type { TransferRawRequest } from "./buildTransaction";
import type { DecodedCallContent } from "./combine";
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

/**
 * Submit a signed ledger transfer and return its transaction hash once the ledger accepts it.
 *
 * Only a certified reply settles the outcome. Without one, the call can still execute, but no signed
 * read-state request exists to poll its status, so the broadcast fails as the account bridge does.
 */
export async function broadcast(tx: string): Promise<string> {
  const envelope = Buffer.from(tx, "hex");
  const { content } = Cbor.decode<{ content: DecodedCallContent }>(envelope);
  const canisterId = Principal.fromUint8Array(content.canister_id).toText();
  if (canisterId !== MAINNET_LEDGER_CANISTER_ID || content.method_name !== "transfer") {
    throw new Error(`[ICP](broadcast) Not a ledger transfer: ${canisterId}.${content.method_name}`);
  }

  const expiresAt = Number(content.ingress_expiry / NANOS_PER_MILLI);
  if (expiresAt <= Date.now()) throw new ICPTransactionExpired(undefined, { expiresAt });
  const hash = transferHash(content);

  const callResponse = await broadcastTxn(envelope, MAINNET_LEDGER_CANISTER_ID, "call");
  if (!callResponse) {
    throw new Error("[ICP](broadcast) The node returned no certificate");
  }
  const requestIdHex = Buffer.from(requestIdOf(content)).toString("hex");
  throwIfLedgerTransferRefused(await readTransferOutcome(callResponse, requestIdHex));

  return hash;
}
