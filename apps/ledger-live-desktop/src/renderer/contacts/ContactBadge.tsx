import React from "react";
import { useTranslation } from "react-i18next";
import { Tag } from "@ledgerhq/lumen-ui-react";

export type ContactBadgeKind = "external" | "ledgerAccount";

type Props = {
  kind: ContactBadgeKind;
};

export const ContactBadge = ({ kind }: Props) => {
  const { t } = useTranslation();
  const label =
    kind === "ledgerAccount" ? t("contacts.badge.ledgerAccount") : t("contacts.badge.external");
  return (
    <Tag
      data-testid={`contacts-badge-${kind}`}
      size="sm"
      appearance={kind === "ledgerAccount" ? "accent-subtle" : "gray"}
      label={label}
    />
  );
};
