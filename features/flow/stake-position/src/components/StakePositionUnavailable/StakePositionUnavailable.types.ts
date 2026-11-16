export type StakePositionUnavailableProps = Readonly<{
  /** `loading` while the account syncs, `notFound` once a shown position is gone. */
  reason: "loading" | "notFound";
  onDismiss: () => void;
  testID?: string;
}>;
