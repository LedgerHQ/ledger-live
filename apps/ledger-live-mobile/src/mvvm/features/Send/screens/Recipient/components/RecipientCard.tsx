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
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-rnative";
import { Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
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
      size="lg"
      isFull
      disabled={!isReady || !hasAddressBook}
      testID="send-recipient-card-add-contact"
    >
      {addContactLabel}
    </Button>
  );

  return (
    <Card lx={{ marginHorizontal: "s8" }} testID="send-recipient-card">
      <CardHeader>
        <CardLeading>
          {contact ? (
            <Box
              lx={{
                alignItems: "center",
                backgroundColor: "canvas",
                borderRadius: "full",
                height: "s48",
                justifyContent: "center",
                width: "s48",
              }}
            >
              <Text typography="body2SemiBold" lx={{ color: "base" }}>
                {getContactInitials(contact.contactName)}
              </Text>
            </Box>
          ) : (
            <Spot appearance="icon" icon={Wallet} />
          )}
          <CardContent>
            <CardContentTitle>{contact?.contactName ?? recipient}</CardContentTitle>
            {(contact?.addressLabel ?? description) && (
              <CardContentDescription>
                {contact?.addressLabel ?? description}
              </CardContentDescription>
            )}
          </CardContent>
        </CardLeading>
      </CardHeader>

      <Box
        lx={{
          flexDirection: "row",
          gap: "s8",
          padding: "s16",
          paddingTop: "s0",
        }}
      >
        {!contact &&
          (!isReady || hasAddressBook ? (
            <Box lx={{ flex: 1 }}>{addContactButton}</Box>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Box lx={{ flex: 1 }}>{addContactButton}</Box>
              </TooltipTrigger>
              <TooltipContent
                title={addressBookUnsupportedLabel}
                content={
                  <Text typography="body1" lx={{ color: "base" }}>
                    {addressBookUnsupportedLabel}
                  </Text>
                }
              />
            </Tooltip>
          ))}
        <Box lx={{ flex: 1 }}>
          <Button
            appearance="base"
            size="lg"
            isFull
            onPress={onSend}
            disabled={!isReady}
            testID="new-send-flow-address-confirm"
          >
            {sendLabel}
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
