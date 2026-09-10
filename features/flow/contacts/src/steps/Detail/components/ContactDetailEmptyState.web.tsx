import React from "react";
import { useTranslation } from "@shared/i18n";
import type { ContactDetailViewProps } from "../types";

type ContactDetailEmptyStateProps = Pick<ContactDetailViewProps, "contact">;

export function ContactDetailEmptyState({
  contact,
}: ContactDetailEmptyStateProps): React.ReactNode {
  const { t } = useTranslation();
  const title = contact.isMe
    ? t("contacts.detail.emptyState.meTitle")
    : t("contacts.detail.emptyState.contactTitle", { name: contact.name });
  const description = contact.isMe
    ? t("contacts.detail.emptyState.meDescription")
    : t("contacts.detail.emptyState.contactDescription", { name: contact.name });

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
