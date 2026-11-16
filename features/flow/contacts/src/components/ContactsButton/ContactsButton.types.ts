export type ContactsButtonProps = Readonly<{
  title: string;
  description: string;
  newBadgeLabel?: string;
  onOpenContacts: () => void;
  testID?: string;
}>;
