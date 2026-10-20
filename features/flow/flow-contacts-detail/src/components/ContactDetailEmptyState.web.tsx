import React from "react";
import type { ContactDetailViewProps } from "../types";
import { useContactDetailEmptyStateCopy } from "../copy/useContactDetailEmptyStateCopy";

type ContactDetailEmptyStateProps = Pick<ContactDetailViewProps, "contact">;

export function ContactDetailEmptyState({
  contact,
}: ContactDetailEmptyStateProps): React.ReactNode {
  const { title, description } = useContactDetailEmptyStateCopy(contact);

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4 px-24 text-center"
      data-testid="contacts-detail-empty-state"
    >
      <p className="body-1-semi-bold text-base">{title}</p>
      <p className="body-2 text-muted">{description}</p>
    </div>
  );
}
