export interface AccountNameToolRow {
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
