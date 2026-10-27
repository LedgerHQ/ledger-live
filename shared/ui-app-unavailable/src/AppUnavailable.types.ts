export type AppUnavailableAction = Readonly<{
  label: string;
  onOpenLearnMore: () => void;
  testID?: string;
}>;

export type AppUnavailableProps = Readonly<{
  title: string;
  description: string;
  action?: AppUnavailableAction;
  testID?: string;
}>;
