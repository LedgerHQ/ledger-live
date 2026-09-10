import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import type { ContactDetailViewProps } from "../types";

type ContactDetailEmptyStateProps = Pick<ContactDetailViewProps, "contact">;

export function ContactDetailEmptyState({
  contact,
}: ContactDetailEmptyStateProps): React.JSX.Element {
  const { t } = useTranslation();
  const title = contact.isMe
    ? t("contacts.detail.emptyState.meTitle")
    : t("contacts.detail.emptyState.contactTitle", { name: contact.name });
  const description = contact.isMe
    ? t("contacts.detail.emptyState.meDescription")
    : t("contacts.detail.emptyState.contactDescription", { name: contact.name });

  return (
    <Box
      testID="contacts-detail-empty-state"
      lx={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: "s4",
        paddingHorizontal: "s24",
      }}
    >
      <Text typography="body1SemiBold" lx={{ color: "base", textAlign: "center" }}>
        {title}
      </Text>
      <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
        {description}
      </Text>
    </Box>
  );
}
