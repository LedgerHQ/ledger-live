import { HOOKS_TRACKING_LOCATIONS } from "./hooks/variables";

/**
 * In-memory origin flow for analytics (e.g. "Receive", "Ledger Sync", "Buy").
 * Set when entering a flow or when opening a drawer; read when showing Buy Device drawer (trigger).
 * Same pattern as desktop LLD originFlow – avoids ref/source being overwritten by other screens.
 */
let originFlow = "";

export function getOriginFlow(): string | HOOKS_TRACKING_LOCATIONS {
  return originFlow;
}

export function setOriginFlow(value: string | HOOKS_TRACKING_LOCATIONS): void {
  originFlow = value;
}
