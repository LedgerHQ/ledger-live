import { TransportStatusError } from "@ledgerhq/errors";
import { DeviceNotOnboarded } from "../errors";
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

export function getFlowNameFromMapping<TLocation extends string | number | symbol>(
  location: TLocation | undefined,
  request: unknown,
  flowMapping: Partial<Record<TLocation, FlowName>>,
): FlowName {
  if (!location) return FlowName.unknown;

  const mapped = flowMapping[location] ?? FlowName.unknown;

  if (mapped === FlowName.send) {
    const req = request as { transaction?: { mode?: string } };
    if (req?.transaction?.mode !== FlowName.send) {
      return FlowName.staking;
    }
  }

  return mapped;
}

// remap transport status 6d06/6d07 as DeviceNotOnboarded for UX handling consistency.
export function isDeviceNotOnboardedError(e: unknown) {
  const maybeMessage = (e as { message?: string })?.message;

  return (
    e instanceof DeviceNotOnboarded ||
    (e instanceof TransportStatusError &&
      (maybeMessage?.includes("0x6d06") || maybeMessage?.includes("0x6d07")))
  );
}
