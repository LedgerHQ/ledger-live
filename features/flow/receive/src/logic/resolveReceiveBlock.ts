import type { AccountReceive } from "@domain/entity-account-receive";
import type { ReceiveBlockedReason, ReceiveGate } from "../types";

type Params = Readonly<{
  receive: AccountReceive | undefined;
  gate: ReceiveGate | null | undefined;
  pending: boolean;
  error: unknown;
  isAssetStatusPending: boolean;
  /** The family's activation flow ran and is over: the asset's status is read again. */
  hasReturnedFromActivation: boolean;
  isSanctioned: boolean;
}>;

export type ReceiveBlock = Readonly<{
  isLoadingAddress: boolean;
  blockedReason?: ReceiveBlockedReason;
}>;

const LOADING: ReceiveBlock = { isLoadingAddress: true };
const blocked = (blockedReason: ReceiveBlockedReason): ReceiveBlock => ({
  isLoadingAddress: false,
  blockedReason,
});

/** Whether the address screen waits, shows the address, or tells what stops the account receiving. */
export function resolveReceiveBlock({
  receive,
  gate,
  pending,
  error,
  isAssetStatusPending,
  hasReturnedFromActivation,
  isSanctioned,
}: Params): ReceiveBlock {
  if (gate?.type === "onboarding") return blocked("onboardingRequired");
  if (error && !pending) return blocked("readFailed");
  if (gate === undefined || (hasReturnedFromActivation && isAssetStatusPending)) return LOADING;
  if (gate?.type === "activation") {
    return blocked(
      hasReturnedFromActivation ? "assetActivationPending" : "assetActivationRequired",
    );
  }
  if (gate?.type === "unknown") return blocked("assetActivationUnknown");
  if (!receive) return LOADING;
  return isSanctioned ? blocked("sanctioned") : { isLoadingAddress: false };
}
