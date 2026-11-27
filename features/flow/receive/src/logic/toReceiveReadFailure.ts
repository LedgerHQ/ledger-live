import type { AccountDataError } from "@domain/entity-account-data";

export type ReceiveReadKind = "receive" | "accountStatus" | "assetStatus";

export type ReceiveFailedKind = ReceiveReadKind | "account";

export type ReceiveReadFailure = Readonly<{
  failedKinds: readonly ReceiveFailedKind[];
  readError: AccountDataError | undefined;
}>;

type KindReadOutcome = Readonly<{ failed: boolean; error: AccountDataError | undefined }>;

const READ_KINDS: readonly ReceiveReadKind[] = ["receive", "accountStatus", "assetStatus"];

const MISSING_ACCOUNT: ReceiveReadFailure = { failedKinds: ["account"], readError: undefined };

export function toReceiveReadFailure(
  hasAccount: boolean,
  reads: Readonly<Record<ReceiveReadKind, KindReadOutcome>>,
): ReceiveReadFailure {
  if (!hasAccount) return MISSING_ACCOUNT;
  const failedKinds = READ_KINDS.filter(kind => reads[kind].failed);
  const readError = failedKinds.map(kind => reads[kind].error).find(error => error !== undefined);
  return { failedKinds, readError };
}
