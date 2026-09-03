import { ContactIdSchema } from "@domain/entity-contact";
import { ContactAvatar } from "@features/platform-contacts";
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
  const addContactButton = (
    <Button
      appearance="gray"
      size="sm"
      disabled={!isReady || !hasAddressBook}
      className="w-full"
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
              size="md"
              ariaHidden
              testId="send-recipient-card-avatar"
            />
          ) : (
            <Spot appearance="icon" icon={Wallet} />
          )}
          <CardContent className="min-w-0">
            <CardContentTitle className={contact ? undefined : "break-all whitespace-normal"}>
              {contact?.contactName ?? recipient}
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
        <div className="flex gap-8 px-16 pb-16">
          {!contact &&
            (!isReady || hasAddressBook ? (
              <div className="flex-1">{addContactButton}</div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex flex-1" onPointerDown={onUnsupportedNetwork}>
                    {addContactButton}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">{addressBookUnsupportedLabel}</TooltipContent>
              </Tooltip>
            ))}
          <Button
            appearance="base"
            size="sm"
            className="flex-1"
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
