import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import {
  FlowName,
  getCurrencyName,
  getFlowNameFromMapping,
} from "@ledgerhq/live-common/device-action/utils";

export { FlowName, getCurrencyName };

export function getFlowName(
  location: HOOKS_TRACKING_LOCATIONS | undefined,
  request: unknown,
): FlowName {
  const flowMapping: Partial<Record<HOOKS_TRACKING_LOCATIONS, FlowName>> = {
    [HOOKS_TRACKING_LOCATIONS.sendFlow]: FlowName.send,
    [HOOKS_TRACKING_LOCATIONS.receiveFlow]: FlowName.receive,
    [HOOKS_TRACKING_LOCATIONS.swapFlow]: FlowName.swap,
    [HOOKS_TRACKING_LOCATIONS.addAccount]: FlowName.addAccount,
  };
  return getFlowNameFromMapping(location, request, flowMapping);
}
