import { sanitizeErrorMessage } from "./errorMessage";
import { TransactionStage, type LogEvent } from "./logEvent";

export type DatadogBroadcastLog = {
  message: "tx_broadcast";
  status: "success" | "failure";
  attributes: Record<string, unknown>;
};

/**
 * Maps a transaction {@link LogEvent} to a Datadog log, or `null` when it is not a broadcast
 * outcome.
 *
 * Unlike the Segment mapping, every broadcast is kept — plain sends, swaps, dApp and live-app
 * transactions alike: this is operational monitoring of the broadcast step, not the earn funnel.
 * The bridge seam sees every family and every route, which is what the screen-level
 * `broadcastLogger` cannot guarantee.
 *
 * Everything sent is in an allow-list of attributes. `txPayload` (the signed transaction) and
 * validators are left out, and so is the error's stack. The error's message is sent only through
 * {@link sanitizeErrorMessage}: its text comes from the node or the coin module and can quote the
 * transaction (coin-zcash redacts long hex runs in its own log, then rethrows the original error).
 */
export function toDatadogBroadcastLog(event: LogEvent): DatadogBroadcastLog | null {
  // Intents only exist at the sign stage, so this also leaves success and failure only.
  if (event.stage !== TransactionStage.Broadcast) return null;

  const attributes: Record<string, unknown> = {
    family: event.family,
    currency_id: event.currencyId,
    token_id: event.tokenId,
    pathway: event.pathway,
    source_type: event.source?.type,
    manifest_id: event.manifestId,
    is_testnet: event.isTestnet,
    is_send_max: event.isSendMax,
    app_version: event.appVersion,
  };

  if (event.status === "success") {
    return { message: "tx_broadcast", status: "success", attributes };
  }

  return {
    message: "tx_broadcast",
    status: "failure",
    attributes: {
      ...attributes,
      error_name: event.error.name,
      error_message: sanitizeErrorMessage(event.error.message),
      error_category: event.errorCategory,
    },
  };
}
