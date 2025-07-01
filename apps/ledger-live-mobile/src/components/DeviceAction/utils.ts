import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";

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
): string {
  if (!location) return "";
  const flowMapping: Partial<Record<HOOKS_TRACKING_LOCATIONS, string>> = {
    [HOOKS_TRACKING_LOCATIONS.sendFlow]: "send",
    [HOOKS_TRACKING_LOCATIONS.receiveFlow]: "receive",
    [HOOKS_TRACKING_LOCATIONS.swapFlow]: "swap",
  };

  const mapped = flowMapping[location] ?? "";

  if (mapped === "send") {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const req = request as { transaction: Transaction & { mode?: string } };
    if (req?.transaction?.mode !== "send") return "staking";
  }
  return mapped;
}
