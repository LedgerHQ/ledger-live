import { TransportStatusError } from "@ledgerhq/errors";
import { DeviceNotOnboarded } from "@ledgerhq/live-common/errors";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { urls } from "~/config/urls";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";

export enum FlowName {
  send = "send",
  receive = "receive",
  swap = "swap",
  staking = "staking",
  addAccount = "addAccount",
  unknown = "unknown",
}

// NB Until we find a better way,
// remap the error if it's 6d06 (LNS, LNSP, LNX) or 6d07 (Stax) and we haven't fallen
// into another handled case.
export function isDeviceNotOnboardedError(e: unknown) {
  return (
    e instanceof DeviceNotOnboarded ||
    (e instanceof TransportStatusError &&
      (e.message.includes("0x6d06") || e.message.includes("0x6d07")))
  );
}

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

export function getCurrencyName(request: unknown): string {
  if (request == null || typeof request !== "object") return "";

  const req = request as {
    tokenCurrency?: TokenCurrency;
    account?: Account;
  };

  const currencyName: string = req.tokenCurrency?.name ?? req.account?.currency?.name ?? "";

  return currencyName;
}

export function getFlowName(
  location: HOOKS_TRACKING_LOCATIONS | undefined,
  request: unknown,
): FlowName {
  if (!location) return FlowName.unknown;

  const flowMapping: Partial<Record<HOOKS_TRACKING_LOCATIONS, FlowName>> = {
    [HOOKS_TRACKING_LOCATIONS.sendModal]: FlowName.send,
    [HOOKS_TRACKING_LOCATIONS.receiveModal]: FlowName.receive,
    [HOOKS_TRACKING_LOCATIONS.exchange]: FlowName.swap,
    [HOOKS_TRACKING_LOCATIONS.genericDAppTransactionSend]: FlowName.send,
    [HOOKS_TRACKING_LOCATIONS.addAccountModal]: FlowName.addAccount,
  };

  const mapped = flowMapping[location] ?? FlowName.unknown;

  if (mapped === FlowName.send) {
    const req = request as { transaction: Transaction & { mode?: string } };
    if (req?.transaction?.mode !== FlowName.send) {
      return FlowName.staking;
    }
  }

  return mapped;
}
