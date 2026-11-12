/** How the last read of a kind went. */
export interface AccountStatusToolRead {
  readonly reading: boolean;
  readonly error?: string;
  readonly sourceId?: string;
  readonly readAt?: number;
}

export interface AccountStatusToolAsset extends AccountStatusToolRead {
  readonly assetId: string;
  /** The asset gate, `none` when there is none; absent until a first read answered. */
  readonly gate?: string;
  /** What stops the account receiving the asset: its onboarding first, then the asset gate. */
  readonly receiveGate?: string;
}

export interface AccountStatusToolAccount extends AccountStatusToolRead {
  readonly accountUUID: string;
  /** The account descriptor as JSON, revealed by clicking the UUID. */
  readonly descriptor?: string;
  /** Absent until a first read answered. */
  readonly used?: boolean;
  readonly gate?: string;
  readonly sendGate?: string;
  readonly assets: readonly AccountStatusToolAsset[];
}

export interface AccountStatusToolProps {
  readonly accounts: readonly AccountStatusToolAccount[];
  /** Reads the account's status again, whatever its age. */
  readonly onRead: (accountUUID: string) => void;
  readonly onReadAll: () => void;
  /** Reads the status of one asset of the account, a token id or the native coin id. */
  readonly onReadAsset: (accountUUID: string, assetId: string) => void;
}
