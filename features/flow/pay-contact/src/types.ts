export type EmptyStateLabels = Readonly<{
  info: string;
  addContactLabel: string;
}>;

export type EmptyStateProps = EmptyStateLabels & Readonly<{ onAddContact: () => void }>;

export type ContactsProps = Readonly<{
  title: string;
  emptyState: EmptyStateProps;
}>;

export type ContactsViewProps = Readonly<{
  title: string;
  isEmpty: boolean;
  emptyState: EmptyStateProps;
}>;
