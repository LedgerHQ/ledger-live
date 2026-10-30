export interface AccountDescriptorToolRow {
  readonly accountUUID: string;
  /** Absent for an account that only exists remotely. */
  readonly legacyId?: string;
  readonly type: string;
  readonly network: string;
  readonly path: string;
  /** The xpub of a utxo account, the address of an address account. */
  readonly key: string;
}

export interface AccountDescriptorToolProps {
  readonly accounts: readonly AccountDescriptorToolRow[];
}
