import { ContactIdSchema } from "@domain/entity-contact";
import { ContactAvatar, useContactDisplayName } from "@features/platform-contacts";
import type { MatchedContact } from "@ledgerhq/live-common/flows/send/recipient/types";
import {
  Button,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  Spot,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { Wallet } from "@ledgerhq/lumen-ui-react/symbols";
import React from "react";

type RecipientCardProps = Readonly<{
  recipient: string;
  description?: string;
  contact?: MatchedContact;
  isReady: boolean;
  showActions: boolean;
  hasAddressBook: boolean;
  addressBookUnsupportedLabel: string;
  addContactLabel: string;
  sendLabel: string;
  onSend: () => void;
  onAddContact: () => void;
  onUnsupportedNetwork: () => void;
}>;

export function RecipientCard({
  recipient,
  description,
  contact,
  isReady,
  showActions,
  hasAddressBook,
  addressBookUnsupportedLabel,
  addContactLabel,
  sendLabel,
  onSend,
  onAddContact,
  onUnsupportedNetwork,
}: RecipientCardProps) {
  const getDisplayName = useContactDisplayName();
  const addContactButton = (
    <Button
      appearance="gray"
      size="sm"
      disabled={!isReady || !hasAddressBook}
      className="size-full [&>span]:text-center"
      onClick={onAddContact}
      data-testid="send-recipient-card-add-contact"
    >
      {addContactLabel}
    </Button>
  );

  return (
    <Card data-testid="send-recipient-card">
      <CardHeader className={showActions ? undefined : "pb-16"}>
        <CardLeading>
          {contact ? (
            <ContactAvatar
              contactId={ContactIdSchema.parse(contact.contactId)}
              name={contact.contactName}
              isMe={contact.isMe}
              size="md"
              ariaHidden
              testID="send-recipient-card-avatar"
            />
          ) : (
            <Spot icon={Wallet} />
          )}
          <CardContent className="min-w-0">
            <CardContentTitle className={contact ? undefined : "break-all whitespace-normal"}>
              {contact
                ? getDisplayName({ name: contact.contactName, isMe: contact.isMe })
                : recipient}
            </CardContentTitle>
            {(contact?.addressLabel ?? description) && (
              <CardContentDescription className="whitespace-normal">
                {contact?.addressLabel ?? description}
              </CardContentDescription>
            )}
          </CardContent>
        </CardLeading>
      </CardHeader>

      {showActions && (
        <div className={`grid gap-8 px-16 pb-16 ${contact ? "grid-cols-1" : "grid-cols-2"}`}>
          {!contact &&
            (!isReady || hasAddressBook ? (
              <div className="min-w-0">{addContactButton}</div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex min-w-0" onPointerDown={onUnsupportedNetwork}>
                    {addContactButton}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">{addressBookUnsupportedLabel}</TooltipContent>
              </Tooltip>
            ))}
          <Button
            appearance="base"
            size="sm"
            className="size-full min-w-0 [&>span]:text-center"
            onClick={onSend}
            disabled={!isReady}
            data-testid="send-recipient-card-send"
          >
            {sendLabel}
          </Button>
        </div>
      )}
    </Card>
  );
}
