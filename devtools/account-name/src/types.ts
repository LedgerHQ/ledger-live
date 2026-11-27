export interface AccountNameToolRow {
  /** Stable and unique per account, and shows nothing of the legacy id. */
  readonly key: string;
  /** Display only: the host may redact it, so two rows can show the same one. */
  readonly legacyId: string;
  /** Absent for a token account or an account the accounts slice does not hold. */
  readonly accountUUID?: string;
  readonly name: string;
  /** No name in the slice: `name` is the default the app shows. */
  readonly isDefault: boolean;
}

export interface AccountNameToolProps {
  readonly names: readonly AccountNameToolRow[];
  readonly nameOf: (accountUUID: string) => string | undefined;
}
