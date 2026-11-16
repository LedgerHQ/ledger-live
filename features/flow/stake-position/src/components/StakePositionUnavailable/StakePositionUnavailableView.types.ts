export type StakePositionUnavailableViewProps =
  | Readonly<{ reason: "loading"; text: string; testID?: string }>
  | Readonly<{
      reason: "notFound";
      title: string;
      description: string;
      closeLabel: string;
      onDismiss: () => void;
      testID?: string;
    }>;
