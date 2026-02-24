import {
  FlowName,
  getCurrencyName,
  getFlowNameFromMapping,
  isDeviceNotOnboardedError,
} from "@ledgerhq/live-common/device-action/utils";
import { urls } from "~/config/urls";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";

export { FlowName, getCurrencyName, isDeviceNotOnboardedError };

export function getNoSuchAppProviderLearnMoreMetadataPerApp(appName: string): {
  learnMoreTextKey?: string;
  learnMoreLink?: string;
} {
  switch (appName) {
    case "Ledger Sync":
      return {
        learnMoreLink: urls.learnMoreLedgerSync,
        learnMoreTextKey: "errors.NoSuchAppOnProvider.learnMoreCTA",
      };
    default:
      return {};
  }
}

export function getFlowName(
  location: HOOKS_TRACKING_LOCATIONS | undefined,
  request: unknown,
): FlowName {
  const flowMapping: Partial<Record<HOOKS_TRACKING_LOCATIONS, FlowName>> = {
    [HOOKS_TRACKING_LOCATIONS.sendModal]: FlowName.send,
    [HOOKS_TRACKING_LOCATIONS.receiveModal]: FlowName.receive,
    [HOOKS_TRACKING_LOCATIONS.exchange]: FlowName.swap,
    [HOOKS_TRACKING_LOCATIONS.genericDAppTransactionSend]: FlowName.send,
    [HOOKS_TRACKING_LOCATIONS.addAccountModal]: FlowName.addAccount,
  };

  return getFlowNameFromMapping(location, request, flowMapping);
}
