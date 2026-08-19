import invariant from "invariant";
import { sdkClient } from "../network/sdk";
import { MAX_SIGNATURES_PER_TRANSACTION } from "../constants";
import type { AleoCoinConfig, PreparedRequestResponse } from "../types";
import { fromHex, toHex } from "./utils";

function validateSignatures(request: PreparedRequestResponse, signatures: string[]): void {
  // One signature per transition: the root plus every flattened nested call.
  let expected = 1;
  let level = request.nested_calls ?? [];
  while (level.length > 0) {
    expected += level.length;
    level = level.flatMap(call => call.nested_calls ?? []);
  }

  invariant(signatures.length > 0, "aleo: combine requires at least one signature");
  invariant(
    signatures.length <= MAX_SIGNATURES_PER_TRANSACTION,
    `aleo: too many signatures for a single transaction (max ${MAX_SIGNATURES_PER_TRANSACTION})`,
  );
  invariant(
    signatures.length === expected,
    `aleo: expected ${expected} signature(s) but received ${signatures.length}`,
  );
}

/**
 * Combines a crafted request with its ordered signatures (root first, then nested calls).
 *
 * Returns hex(AuthorizationResponse) rather than the bare authorization so the fee cycle can reuse
 * the root cycle's `execution_id`; the caller assembles the final envelope.
 */
export async function combine({
  config,
  transaction,
  signatures,
  viewKey,
}: {
  config: AleoCoinConfig;
  transaction: string;
  signatures: string[];
  viewKey: string;
}): Promise<string> {
  const request = fromHex<PreparedRequestResponse>(transaction);

  validateSignatures(request, signatures);

  const authorization = await sdkClient.createAuthorization({
    config,
    request,
    signatures,
    viewKey,
  });

  return toHex(authorization);
}
