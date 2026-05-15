import React from "react";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import {
  useRecipientSuggestions,
  type RecipientSuggestion,
} from "../hooks/useRecipientSuggestions";

type Props = {
  query: string;
  chainId: number | undefined;
  onSelect: (suggestion: RecipientSuggestion) => void;
};

const shortAddress = (addressHex: string): string =>
  `${addressHex.slice(0, 6)}…${addressHex.slice(-4)}`;

type RowProps = {
  suggestion: RecipientSuggestion;
  onSelect: (suggestion: RecipientSuggestion) => void;
};

const RecipientRow = ({ suggestion, onSelect }: RowProps) => (
  <ListItem
    data-testid={`send-recipient-suggestion-${suggestion.kind}-${suggestion.name}`}
    onClick={() => onSelect(suggestion)}
  >
    <ListItemLeading>
      <Avatar size="sm" alt={suggestion.name} />
      <ListItemContent>
        <ListItemTitle>{suggestion.name}</ListItemTitle>
        <ListItemDescription>{shortAddress(suggestion.addressHex)}</ListItemDescription>
      </ListItemContent>
    </ListItemLeading>
  </ListItem>
);

export const RecipientPicker = ({ query, chainId, onSelect }: Props) => {
  const { t } = useTranslation();
  const { ledgerAccounts, external } = useRecipientSuggestions(query, chainId);

  if (ledgerAccounts.length === 0 && external.length === 0) return null;

  return (
    <div className="mb-12 flex flex-col gap-8 px-24" data-testid="send-recipient-picker">
      {ledgerAccounts.length > 0 && (
        <section className="flex flex-col">
          <Subheader>
            <SubheaderRow>
              <SubheaderTitle>{t("contacts.picker.ledgerAccounts")}</SubheaderTitle>
            </SubheaderRow>
          </Subheader>
          {ledgerAccounts.map(s => (
            <RecipientRow key={s.id} suggestion={s} onSelect={onSelect} />
          ))}
        </section>
      )}
      {external.length > 0 && (
        <section className="flex flex-col">
          <Subheader>
            <SubheaderRow>
              <SubheaderTitle>{t("contacts.picker.addressBook")}</SubheaderTitle>
            </SubheaderRow>
          </Subheader>
          {external.map(s => (
            <RecipientRow key={s.id} suggestion={s} onSelect={onSelect} />
          ))}
        </section>
      )}
    </div>
  );
};
