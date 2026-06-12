import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { SignedNameBadge } from "LLD/components/SignedNameBadge";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import { InitialsAvatar } from "~/mvvm/features/Contacts/Management/components/InitialsAvatar";
import type { RecipientSuggestion } from "../hooks/useRecipientSuggestions";
import type { SendAccountSuggestion } from "../hooks/useSendAccountSuggestions";
import { useFormattedAccountBalance } from "../screens/Recipient/hooks/useFormattedAccountBalance";

/**
 * Rows shared by the Recipient previews (under the address input) and the
 * full-list Contacts / My accounts views — Figma 14437:40339 / 40767 / 43129.
 */

type ContactRowProps = Readonly<{
  suggestion: RecipientSuggestion;
  onSelect: (suggestion: RecipientSuggestion) => void;
}>;

/**
 * Contact row, styled like the Contacts page: photo (or initials) avatar,
 * contact name, then the per-address name (`scope`) as description. Falls
 * back to the truncated address when the entry carries no scope.
 */
export const ContactSuggestionRow = ({ suggestion, onSelect }: ContactRowProps) => {
  const description =
    suggestion.scope && suggestion.scope.length > 0
      ? suggestion.scope
      : formatAddress(suggestion.addressHex, { prefixLength: 5, suffixLength: 5 });
  return (
    <ListItem
      data-testid={`send-recipient-contact-${suggestion.name}`}
      onClick={() => onSelect(suggestion)}
    >
      <ListItemLeading>
        {/* InitialsAvatar resolves the contact's uploaded photo from the
            contactPhoto sidecar by itself; initials are the fallback. */}
        <InitialsAvatar name={suggestion.name} size="sm" />
        <ListItemContent>
          <ListItemTitle>{suggestion.name}</ListItemTitle>
          <ListItemDescription>{description}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
};

type AccountRowProps = Readonly<{
  suggestion: SendAccountSuggestion;
  onSelect: (suggestion: SendAccountSuggestion) => void;
}>;

/**
 * Own-account row, styled like the accounts list: squared crypto icon,
 * account name (with the shield-check badge when the name is signed with
 * the device), truncated address — and the fiat countervalue + crypto
 * balance trailing (Figma's "$3,000 / 0.118 ETH" column) when the row is
 * backed by a Ledger Live account.
 */
export const AccountSuggestionRow = ({ suggestion, onSelect }: AccountRowProps) => {
  const { account, name, address, signed, currencyId, ticker } = suggestion;
  const { formattedBalance, formattedCounterValue } = useFormattedAccountBalance(account);
  return (
    <ListItem data-testid={`send-recipient-account-${name}`} onClick={() => onSelect(suggestion)}>
      <ListItemLeading>
        <SquaredCryptoIcon size={48} ledgerId={currencyId} ticker={ticker} />
        <ListItemContent>
          {signed ? (
            <div className="flex items-center gap-6">
              <ListItemTitle>{name}</ListItemTitle>
              <SignedNameBadge data-testid="send-recipient-account-signed-shield" />
            </div>
          ) : (
            <ListItemTitle>{name}</ListItemTitle>
          )}
          <ListItemDescription>
            {formatAddress(address, { prefixLength: 5, suffixLength: 5 })}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      {(formattedCounterValue || formattedBalance) && (
        <ListItemTrailing>
          <ListItemContent>
            {formattedCounterValue && <ListItemTitle>{formattedCounterValue}</ListItemTitle>}
            {formattedBalance && <ListItemDescription>{formattedBalance}</ListItemDescription>}
          </ListItemContent>
        </ListItemTrailing>
      )}
    </ListItem>
  );
};

type ContactMatchedRowProps = Readonly<{
  /** The contact's display name. */
  name: string;
  /** The matched entry's per-address name (e.g. "Ethereum"); may be empty. */
  scope?: string;
  /** Full recipient address (truncated in the description). */
  address: string;
  onSelect: () => void;
}>;

/**
 * The contact-matched confirmation row (Figma 14437:40510): shown in the
 * dialog body when the typed/pasted address resolves to an address-book
 * contact. 48px photo/initials avatar, contact name, "scope - 0x95…csuz"
 * description, chevron trailing. Clicking commits the recipient and
 * advances to the Amount step.
 */
export const ContactMatchedRow = ({ name, scope, address, onSelect }: ContactMatchedRowProps) => {
  const formattedAddress = formatAddress(address, { prefixLength: 5, suffixLength: 5 });
  const description =
    scope && scope.length > 0 ? `${scope} - ${formattedAddress}` : formattedAddress;
  return (
    <ListItem onClick={onSelect} data-testid="send-matched-contact-row">
      <ListItemLeading>
        <InitialsAvatar name={name} size="md" />
        <ListItemContent>
          <ListItemTitle>{name}</ListItemTitle>
          <ListItemDescription>{description}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ChevronRight size={24} />
      </ListItemTrailing>
    </ListItem>
  );
};
