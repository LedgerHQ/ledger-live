export interface AccountReceiveToolAddress {
  readonly address: string;
  /** What the device confirms, e.g. "shows canton_9f3c at m/44h/6767h/0h/0h/0h"; absent when it cannot. */
  readonly verification?: string;
  /** Present when the host can ask the device to show this address. */
  readonly onVerify?: () => void;
  /** The last device verification, e.g. "verified" or "mismatch: device showed 0x…". */
  readonly verifyOutcome?: string;
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
  /** Reads the receive of the account again, whatever its age. */
  readonly onRead: (accountUUID: string) => void;
  readonly onReadAll: () => void;
}
