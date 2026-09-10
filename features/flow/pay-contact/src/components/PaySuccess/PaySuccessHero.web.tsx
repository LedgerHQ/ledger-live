import React from "react";
import { Avatar } from "@ledgerhq/lumen-ui-react";
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
    <div className="flex flex-col items-center gap-24">
      {recipient ? (
        <ContactAvatar
          contactId={recipient.id}
          name={recipient.name}
          isMe={recipient.isMe}
          size={AVATAR_SIZE}
          ariaHidden
        />
      ) : (
        <Avatar size={AVATAR_SIZE} aria-hidden />
      )}
      <div className="flex flex-col items-center gap-8">
        <h3 className="text-center heading-3-semi-bold">
          {t("payTab.contacts.paySuccess.title", { recipient: recipientLabel })}
        </h3>
        <h3 className="text-center heading-3-semi-bold">{amountFormatted}</h3>
      </div>
    </div>
  );
}
