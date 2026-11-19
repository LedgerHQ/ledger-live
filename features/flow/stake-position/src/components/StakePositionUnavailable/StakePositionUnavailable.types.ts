export type StakePositionUnavailableProps = Readonly<{
  /**
   * `loading` until the position is read, `notFound` when it cannot be shown, `error` when it
   * failed to load.
   */
  reason: "loading" | "notFound" | "error";
  onDismiss: () => void;
  /** Reads the position again, from the error. */
  onRetry?: () => void;
  testID?: string;
}>;
