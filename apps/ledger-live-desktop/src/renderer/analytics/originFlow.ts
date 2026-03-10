/**
 * In-memory origin flow (e.g. "Manager Dashboard", "Receive Modal") for analytics.
 * Set when entering a flow or when opening Buy Device; read when showing Buy Device modal (trigger).
 * Same pattern as screenRefs / setTrackingSource for analytics context outside Redux.
 */
let originFlow = "";

export function getOriginFlow(): string {
  return originFlow;
}

export function setOriginFlow(value: string): void {
  originFlow = value;
}
