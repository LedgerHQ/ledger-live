import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import type { CantonContext } from "../config";
import { prepareTransferRequest } from "../network/gateway";
import type { PrepareTransferRequest } from "../types/gateway";
import type { CantonCraftedEnvelope, CantonMemo } from "../types/transaction";
import { instrumentOf } from "./asset";

const DEFAULT_EXPIRATION_SECONDS = 24 * 60 * 60;
// "Payment" is the generic adapter's intent type for a transaction without a `mode`.
const TRANSFER_INTENT_TYPES = new Set(["send", "Payment"]);

type CantonIntent = TransactionIntent<CantonMemo>;

function reasonOf(intent: CantonIntent): string | undefined {
  // Typed as the reason memo, but the generic adapter also sends `{ type: "none" }`.
  const memo: { type: string; kind?: string; value?: string } | undefined =
    "memo" in intent ? intent.memo : undefined;
  if (!memo || memo.type === "none") return undefined;
  if (memo.type !== "string" || memo.kind !== "reason") {
    throw new InvalidParameterError("canton: only a reason memo is supported");
  }
  return memo.value || undefined;
}

export async function craftTransaction(
  context: CantonContext,
  intent: CantonIntent,
): Promise<{ transaction: string; details: { hash: string } }> {
  if (intent.intentType !== "transaction" || !TRANSFER_INTENT_TYPES.has(intent.type)) {
    throw new InvalidParameterError(
      `canton: unsupported intent ${intent.intentType}/${intent.type}`,
    );
  }
  if (!intent.sender) {
    throw new InvalidParameterError("canton: the sender party id is required");
  }
  const reason = reasonOf(intent);
  const config = await context.config();
  const { instrumentId, instrumentAdmin } = instrumentOf(intent.asset, config.nativeInstrumentId);

  const params: PrepareTransferRequest = {
    type: "token-transfer-request",
    recipient: intent.recipient,
    amount: intent.amount.toString(),
    execute_before_secs: intent.expiration ?? DEFAULT_EXPIRATION_SECONDS,
    instrument_id: instrumentId,
    ...(reason ? { reason } : {}),
    ...(instrumentAdmin ? { instrument_admin: instrumentAdmin } : {}),
  };
  const { serialized, json, hash } = await prepareTransferRequest(config, intent.sender, params);

  const envelope: CantonCraftedEnvelope = { party: intent.sender, serialized, json };
  return { transaction: JSON.stringify(envelope), details: { hash } };
}
