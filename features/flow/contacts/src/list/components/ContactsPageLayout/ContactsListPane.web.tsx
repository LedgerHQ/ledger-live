import React, { type ReactNode } from "react";

type ContactsListPaneProps = Readonly<{
  children: ReactNode;
}>;

export function ContactsListPane({
  children,
}: ContactsListPaneProps): React.ReactNode {
  return (
    <aside
      className="flex w-2/5 min-w-[400px] max-w-[445px] shrink-0 flex-col overflow-auto rounded-lg bg-section p-16"
      data-testid="contacts-list-pane"
    >
      {children}
    </aside>
  );
}
