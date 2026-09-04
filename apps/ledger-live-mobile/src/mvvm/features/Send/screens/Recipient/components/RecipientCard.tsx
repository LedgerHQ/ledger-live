import { ContactIdSchema } from "@domain/entity-contact";
import { ContactAvatar } from "@features/platform-contacts";
import type { MatchedContact } from "@ledgerhq/live-common/flows/send/recipient/types";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
import React from "react";
import { AddContactAction } from "./AddContactAction";

type RecipientCardProps = Readonly<{
  recipient: string;
  description?: string;
  contact?: MatchedContact;
  isReady: boolean;
  showActions: boolean;
  hasAddressBook: boolean;
  addressBookUnsupportedTitle: string;
  addressBookUnsupportedDescription: string;
  addContactLabel: string;
  sendLabel: string;
  onAddContact: () => void;
  onSend: () => void;
}>;

export function RecipientCard({
  recipient,
  description,
  contact,
  isReady,
  showActions,
  hasAddressBook,
  addressBookUnsupportedTitle,
  addressBookUnsupportedDescription,
  addContactLabel,
  sendLabel,
  onAddContact,
  onSend,
}: RecipientCardProps) {
  return (
    <Card type="info" testID="send-recipient-card" lx={{ marginHorizontal: "s8" }}>
      <CardHeader lx={showActions ? undefined : { paddingBottom: "s16" }}>
        <CardLeading>
          {contact ? (
            <ContactAvatar
              contactId={ContactIdSchema.parse(contact.contactId)}
              name={contact.contactName}
              size="md"
              testId="send-recipient-card-avatar"
            />
          ) : (
            <Spot appearance="icon" icon={Wallet} />
          )}
          <CardContent>
            <CardContentTitle typography="body2SemiBold" numberOfLines={contact ? 1 : undefined}>
              {contact?.contactName ?? recipient}
            </CardContentTitle>
            {(contact?.addressLabel ?? description) && (
              <CardContentDescription typography="body3">
                {contact?.addressLabel ?? description}
              </CardContentDescription>
            )}
          </CardContent>
        </CardLeading>
      </CardHeader>

      {showActions && (
        <Box
          lx={{
            flexDirection: "row",
            gap: "s8",
            paddingHorizontal: "s16",
            paddingBottom: "s16",
          }}
        >
          {!contact && (
            <AddContactAction
              hasAddressBook={hasAddressBook}
              label={addContactLabel}
              unsupportedTitle={addressBookUnsupportedTitle}
              unsupportedDescription={addressBookUnsupportedDescription}
              onAddContact={onAddContact}
            />
          )}
          <Button
            appearance="base"
            size="sm"
            onPress={onSend}
            disabled={!isReady}
            testID="send-recipient-card-send"
            lx={{ flex: 1 }}
          >
            {sendLabel}
          </Button>
        </Box>
      )}
    </Card>
  );
}
