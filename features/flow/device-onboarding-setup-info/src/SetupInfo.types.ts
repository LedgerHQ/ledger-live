export type SetupInfoCard =
  | "setupChoice"
  | "recoveryPhrase"
  | "restoreChoice"
  | "recoveryKey"
  | "restoreRecoveryKey";

export type SetupInfoProps = Readonly<{
  /** The card of the current setup stage; none hides the card. */
  card: SetupInfoCard | undefined;
  /** Another sheet (device locked, quit confirmation) takes the screen: hide the info sheet. */
  suspendSheets: boolean;
}>;
