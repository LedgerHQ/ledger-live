import React from "react";
import { useTranslation } from "react-i18next";
import { Tag } from "@ledgerhq/lumen-ui-react";
import { Devices } from "@ledgerhq/lumen-ui-react/symbols";

export type ContactBadgeKind = "external" | "ledgerAccount";

type Props = {
  kind: ContactBadgeKind;
  /** Overrides the default i18n label — used to surface the resolved contact/account name inline. */
  label?: string;
};

export const ContactBadge = ({ kind, label }: Props) => {
  const { t } = useTranslation();
  const text =
    label ??
    (kind === "ledgerAccount" ? t("contacts.badge.ledgerAccount") : t("contacts.badge.external"));
  return kind === "ledgerAccount" ? (
    <Tag
      data-testid={`contacts-badge-${kind}`}
      size="sm"
      appearance="success"
      icon={Devices}
      label={text}
    />
  ) : (
    <Tag
      data-testid={`contacts-badge-${kind}`}
      size="sm"
      appearance="gray"
      label={text}
    />
  );
};
