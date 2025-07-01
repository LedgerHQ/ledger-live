import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";

export enum FlowName {
  send = "send",
  receive = "receive",
  swap = "swap",
  staking = "staking",
  addAccount = "addAccount",
  unknown = "unknown",
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
    [HOOKS_TRACKING_LOCATIONS.sendFlow]: FlowName.send,
    [HOOKS_TRACKING_LOCATIONS.receiveFlow]: FlowName.receive,
    [HOOKS_TRACKING_LOCATIONS.swapFlow]: FlowName.swap,
    [HOOKS_TRACKING_LOCATIONS.addAccount]: FlowName.addAccount,
  };

  const mapped = flowMapping[location] ?? FlowName.unknown;

  if (mapped === FlowName.send) {
    const req = request as { transaction: Transaction & { mode?: string } };
    if (req?.transaction?.mode !== "send") return FlowName.staking;
  }
  return mapped;
}
