export type StakePositionUnavailableViewProps =
  | Readonly<{ reason: "loading"; text: string; testID?: string }>
  | Readonly<{
      reason: "notFound" | "error";
      title: string;
      description: string;
      retry?: Readonly<{ label: string; onRetry: () => void }>;
      closeLabel: string;
      onDismiss: () => void;
      testID?: string;
    }>;
