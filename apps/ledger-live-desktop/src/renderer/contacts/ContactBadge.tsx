import React from "react";
import { useTranslation } from "react-i18next";

export type ContactBadgeKind = "external" | "ledgerAccount";

type Props = {
  kind: ContactBadgeKind;
};

// Alpha-only chip. Lumen has no badge primitive yet, so we compose Lumen tokens
// inline. Designer-led L3 will replace this with the real component.
export const ContactBadge = ({ kind }: Props) => {
  const { t } = useTranslation();
  const label =
    kind === "ledgerAccount" ? t("contacts.badge.ledgerAccount") : t("contacts.badge.external");
  return (
    <span
      data-testid={`contacts-badge-${kind}`}
      className="bg-muted text-base body-3 inline-flex shrink-0 items-center rounded-full px-8 py-2"
    >
      {label}
    </span>
  );
};
