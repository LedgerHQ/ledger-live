import React, { useMemo } from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import {
  createMeDisplayNameFormatter,
  resolveMeContactDisplayName,
} from "@features/platform-contacts";
import { useTranslation } from "@shared/i18n";
import type { ContactDetailViewProps } from "../types";
import { ContactDetailAvatar } from "./ContactDetailAvatar.native";

type ContactDetailHeaderProps = Pick<
  ContactDetailViewProps,
  "contact" | "meAvatarSrc" | "onAddAddress"
>;

export function ContactDetailHeader({
  contact,
  meAvatarSrc,
  onAddAddress,
}: ContactDetailHeaderProps): React.JSX.Element {
  const { t } = useTranslation();
  const formatMeDisplayName = useMemo(
    () =>
      createMeDisplayNameFormatter(t("contacts.me.myAddresses"), name =>
        t("contacts.detail.meDisplayName", { name }),
      ),
    [t],
  );
  const displayName = resolveMeContactDisplayName(contact, formatMeDisplayName);

  return (
    <Box lx={{ alignItems: "center", gap: "s24", paddingTop: "s24" }}>
      <Box lx={{ alignItems: "center", gap: "s16" }}>
        <ContactDetailAvatar contact={contact} meAvatarSrc={meAvatarSrc} />
        <Box lx={{ alignItems: "center", gap: "s4" }}>
          <Text testID="contacts-detail-name" typography="heading3SemiBold" lx={{ color: "base" }}>
            {displayName}
          </Text>
          <Text testID="contacts-detail-address-count" typography="body2" lx={{ color: "muted" }}>
            {t("contacts.addressCount", { count: contact.addresses.length })}
          </Text>
        </Box>
      </Box>
      <Button
        appearance="gray"
        size="sm"
        icon={Plus}
        onPress={onAddAddress}
        testID="contacts-detail-add-address"
      >
        {contact.isMe ? t("contacts.addYourAddress") : t("contacts.addAddress")}
      </Button>
    </Box>
  );
}
