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
  hasAddressBook: boolean;
  addressBookUnsupportedLabel: string;
  addContactLabel: string;
  sendLabel: string;
  onSend: () => void;
}>;

function getContactInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

export function RecipientCard({
  recipient,
  description,
  contact,
  isReady,
  hasAddressBook,
  addressBookUnsupportedLabel,
  addContactLabel,
  sendLabel,
  onSend,
}: RecipientCardProps) {
  const addContactButton = (
    <Button
      appearance="gray"
      size="sm"
      disabled={!isReady || !hasAddressBook}
      className="w-full"
      data-testid="send-recipient-card-add-contact"
    >
      {addContactLabel}
    </Button>
  );

  return (
    <Card data-testid="send-recipient-card">
      <CardHeader>
        <CardLeading>
          {contact ? (
            <div
              className="body-1-semi-bold flex size-48 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"
              aria-hidden
            >
              {getContactInitials(contact.contactName)}
            </div>
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

      <div className="flex gap-8 px-16 pb-16">
        {!contact &&
          (!isReady || hasAddressBook ? (
            <div className="flex-1">{addContactButton}</div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex flex-1">{addContactButton}</span>
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
    </Card>
  );
}
