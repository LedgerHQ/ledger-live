/**
 * In-memory origin flow for analytics (e.g. "Manager Dashboard", "Receive Modal", or Live App names).
 * Set when entering a flow or when opening Buy Device; read when showing Buy Device modal (trigger).
 * Use setOriginFlow(OriginFlowValue): values can be HOOKS_TRACKING_LOCATIONS or any string (e.g. discovery app names).
 * Same pattern as screenRefs / setTrackingSource for analytics context outside Redux.
 */
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";

export { HOOKS_TRACKING_LOCATIONS };

let originFlow = "";

export type OriginFlowValue = HOOKS_TRACKING_LOCATIONS | string;

export function getOriginFlow(): OriginFlowValue {
  return originFlow;
}

export function setOriginFlow(value: OriginFlowValue): void {
  originFlow = value;
}
