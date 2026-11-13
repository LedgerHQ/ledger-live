export interface AccountReceiveToolAddress {
  readonly address: string;
  /** Its type and path, then the address or key the device confirms; absent when it cannot. */
  readonly verification?: string;
}

export interface AccountReceiveToolAccount {
  readonly accountUUID: string;
  /** The account descriptor as JSON, revealed by clicking the UUID. */
  readonly descriptor?: string;
  readonly reading: boolean;
  readonly error?: string;
  readonly sourceId?: string;
  readonly readAt?: number;
  /** Absent until a first read answered. */
  readonly receive?: AccountReceiveToolAddress;
  readonly shielded?: AccountReceiveToolAddress;
}

export interface AccountReceiveToolProps {
  readonly accounts: readonly AccountReceiveToolAccount[];
  /** Reads the account's receive again, whatever its age. */
  readonly onRead: (accountUUID: string) => void;
  readonly onReadAll: () => void;
}
