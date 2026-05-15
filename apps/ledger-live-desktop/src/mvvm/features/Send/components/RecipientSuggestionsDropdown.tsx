import React from "react";
import { useTranslation } from "react-i18next";
import { ContactBadge } from "~/renderer/contacts/ContactBadge";
import type { RecipientSuggestion } from "../hooks/useRecipientSuggestions";

type Props = {
  suggestions: RecipientSuggestion[];
  onSelect: (suggestion: RecipientSuggestion) => void;
};

const shortAddress = (addressHex: string): string =>
  `${addressHex.slice(0, 6)}…${addressHex.slice(-4)}`;

export const RecipientSuggestionsDropdown = ({ suggestions, onSelect }: Props) => {
  const { t } = useTranslation();
  if (suggestions.length === 0) return null;

  return (
    <div
      data-testid="send-recipient-suggestions"
      role="listbox"
      aria-label={t("contacts.suggestions.ariaLabel")}
      className="bg-elevation-elevated absolute left-0 right-0 top-full z-10 mt-4 overflow-hidden rounded-md border border-base shadow-lg"
    >
      {suggestions.map(s => (
        <button
          key={s.id}
          type="button"
          role="option"
          aria-selected={false}
          data-testid={`send-recipient-suggestion-${s.kind}-${s.name}`}
          // `onMouseDown` (not onClick) so the click fires before the input's blur
          // tears the dropdown down. preventDefault keeps focus on the input.
          onMouseDown={e => {
            e.preventDefault();
            onSelect(s);
          }}
          className="hover:bg-muted flex w-full items-center justify-between gap-12 px-16 py-12 text-left transition-colors"
        >
          <div className="flex min-w-0 items-center gap-8">
            <span className="body-3 text-base truncate font-medium">{s.name}</span>
            <ContactBadge kind={s.kind} />
          </div>
          <span className="body-4 text-muted shrink-0 font-mono">{shortAddress(s.addressHex)}</span>
        </button>
      ))}
    </div>
  );
};
