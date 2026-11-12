export type ManageAgentsCardProps = Readonly<{
  title: string;
  description: string;
  newBadgeLabel?: string;
  page: string;
  onOpen: () => void;
  testID?: string;
}>;
