export type ManageAgentsCardProps = Readonly<{
  title: string;
  description: string;
  newBadgeLabel?: string;
  onOpen: () => void;
  testID?: string;
}>;
