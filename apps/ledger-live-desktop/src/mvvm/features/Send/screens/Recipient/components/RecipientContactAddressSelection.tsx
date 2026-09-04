import { findCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Contact } from "@domain/entity-contact";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { SEND_ADDRESS_FORMAT_OPTIONS } from "@ledgerhq/live-common/flows/send/utils";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
} from "@ledgerhq/lumen-ui-react";
import React, { useEffect, useRef } from "react";

type RecipientContactAddressSelectionProps = Readonly<{
  contact: Contact;
  network: CryptoCurrency;
  onAddressSelect: (address: string) => void;
}>;

export function RecipientContactAddressSelection({
  contact,
  network,
  onAddressSelect,
}: RecipientContactAddressSelectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    sectionRef.current?.querySelector<HTMLElement>('[role="button"]')?.focus();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="flex flex-col gap-8"
      data-testid="send-recipient-contact-address-selection"
    >
      <div className="flex items-center gap-8 px-8">
        <CryptoIcon ledgerId={network.id} ticker={network.ticker} size={16} shape="square" />
        <p className="body-2 text-muted">{network.name}</p>
      </div>

      {contact.addresses.map(address => {
        const addressCurrency = findCryptoCurrencyById(address.currencyId);

        return (
          <Card
            key={address.id}
            type="interactive"
            onClick={() => onAddressSelect(address.address)}
            data-testid={`send-recipient-contact-address-${address.id}`}
          >
            <CardHeader>
              <CardLeading>
                <CryptoIcon
                  ledgerId={address.currencyId}
                  ticker={addressCurrency?.ticker ?? address.label}
                  network={address.currencyId === network.id ? undefined : network.id}
                  size={40}
                  shape="circle"
                />
                <CardContent>
                  <CardContentTitle>{address.label}</CardContentTitle>
                  <CardContentDescription>
                    {formatAddress(address.address, SEND_ADDRESS_FORMAT_OPTIONS)}
                  </CardContentDescription>
                </CardContent>
              </CardLeading>
            </CardHeader>
          </Card>
        );
      })}
    </section>
  );
}
