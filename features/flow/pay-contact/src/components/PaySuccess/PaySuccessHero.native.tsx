import React from "react";
import { Avatar, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { ContactAvatar } from "@features/platform-contacts";
import type { ContactId } from "@domain/entity-contact";
import { useTranslation } from "@shared/i18n";

const AVATAR_SIZE = "xl";

export type PaySuccessRecipient = Readonly<{
  id: ContactId;
  name: string;
  isMe?: boolean;
}>;

export type PaySuccessHeroProps = Readonly<{
  recipient?: PaySuccessRecipient;
  recipientLabel: string;
  amountFormatted: string;
}>;

export function PaySuccessHero({
  recipient,
  recipientLabel,
  amountFormatted,
}: PaySuccessHeroProps) {
  const { t } = useTranslation();

  return (
    <Box lx={{ alignItems: "center", gap: "s24" }}>
      {recipient ? (
        <ContactAvatar
          contactId={recipient.id}
          name={recipient.name}
          isMe={recipient.isMe}
          size={AVATAR_SIZE}
        />
      ) : (
        <Avatar size={AVATAR_SIZE} />
      )}
      <Box lx={{ alignItems: "center", gap: "s8" }}>
        <Text typography="heading2SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t("payTab.contacts.paySuccess.title", { recipient: recipientLabel })}
        </Text>
        <Text typography="heading2SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {amountFormatted}
        </Text>
      </Box>
    </Box>
  );
}
