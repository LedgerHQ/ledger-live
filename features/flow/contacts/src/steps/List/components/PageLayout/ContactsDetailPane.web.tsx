import React, { type ReactNode } from "react";

type ContactsDetailPaneProps = Readonly<{
  children?: ReactNode;
}>;

export function ContactsDetailPane({
  children,
}: ContactsDetailPaneProps): React.ReactNode {
  return (
    <div
      className="min-w-0 flex-1 rounded-lg bg-section"
      data-testid="contacts-detail-pane"
    >
      {children}
    </div>
  );
}
