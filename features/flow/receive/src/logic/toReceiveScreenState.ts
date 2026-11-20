import type { AccountReceive } from "@domain/entity-account-receive";
import {
  receiveGate,
  type AccountStatus,
  type AssetActivationMethod,
  type AssetStatus,
} from "@domain/entity-account-status";

/** What the address screen shows, from the account data kinds it reads. */
export type ReceiveScreenState =
  | Readonly<{ type: "loading" }>
  | Readonly<{ type: "ready"; receive: AccountReceive }>
  /** The account must first register on its network (Canton, Concordium). */
  | Readonly<{ type: "onboardingRequired" }>
  /** The token must first be activated on the account (Hedera, Algorand, Stellar, XRP). */
  | Readonly<{ type: "activationRequired"; method: AssetActivationMethod }>
  | Readonly<{ type: "error" }>;

/** One kind as the screen reads it: `failed` when its read failed and nothing is stored. */
export type ReceiveKindRead<T> = Readonly<{ data: T | undefined; failed: boolean }>;

const LOADING: ReceiveScreenState = { type: "loading" };

/**
 * The screen state, from the account's `receive` and `accountStatus` and, for a token, its
 * `assetStatus`. Onboarding wins over a failed `receive` read: an account to onboard has no
 * address yet.
 */
export function toReceiveScreenState({
  receive,
  accountStatus,
  assetStatus,
}: Readonly<{
  receive: ReceiveKindRead<AccountReceive>;
  accountStatus: ReceiveKindRead<AccountStatus>;
  /** Absent for the native coin, which has no asset gate. */
  assetStatus?: ReceiveKindRead<AssetStatus>;
}>): ReceiveScreenState {
  if (accountStatus.data?.gate?.type === "onboarding") return { type: "onboardingRequired" };
  if (receive.failed || accountStatus.failed || assetStatus?.failed) return { type: "error" };
  // `receiveGate` reads a missing `assetStatus` as no gate: wait for it first.
  if (!accountStatus.data || (assetStatus && !assetStatus.data)) return LOADING;

  const gate = receiveGate(accountStatus.data, assetStatus?.data);
  if (gate?.type === "activation") return { type: "activationRequired", method: gate.method };
  return receive.data ? { type: "ready", receive: receive.data } : LOADING;
}
