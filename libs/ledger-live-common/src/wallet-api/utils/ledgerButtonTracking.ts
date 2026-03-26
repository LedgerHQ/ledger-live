import network from "@ledgerhq/live-network/network";

const LEDGER_BUTTON_API_URL = "https://ledgerb.api.ledger.com/event";
const LEDGER_BUTTON_REFERER_PREFIX = "LedgerButton_";

interface ReportLedgerButtonBroadcastParams {
  dappId: string;
  chainId: number;
  networkName: string;
  transactionHash: string;
  referer: string;
}

export function isLedgerButtonReferer(referer?: string): referer is string {
  return !!referer?.startsWith(LEDGER_BUTTON_REFERER_PREFIX);
}

/**
 * Fire-and-forget HTTP POST to ledgerb API to track successful transaction
 */
export function reportLedgerButtonBroadcast({
  dappId,
  chainId,
  networkName,
  transactionHash,
  referer,
}: ReportLedgerButtonBroadcastParams): void {
  network({
    method: "POST",
    url: LEDGER_BUTTON_API_URL,
    headers: {
      "X-Ledger-Domain": dappId,
    },
    data: {
      name: "transaction-flow-completion",
      type: "transaction_flow_completion",
      data: {
        event_id: crypto.randomUUID(),
        transaction_dapp_id: dappId,
        timestamp_ms: Date.now(),
        event_type: "transaction_flow_completion",
        blockchain_network_selected: networkName,
        chain_id: String(chainId),
        referrer: referer,
        transaction_hash: transactionHash,
      },
    },
  }).catch(() => {
    // Intentionally swallowed — tracking must never break the main flow
  });
}
