import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DialogBody, SearchInput } from "@ledgerhq/lumen-ui-react";
import {
  useRecipientSuggestions,
  type RecipientSuggestion,
} from "../../../hooks/useRecipientSuggestions";
import { ContactSuggestionRow } from "../../../components/RecipientRows";

type Props = Readonly<{
  chainId: number | undefined;
  /** Selected crypto's ticker — entries holding a different asset are dropped. */
  selectedTicker: string | undefined;
  onSelect: (suggestion: RecipientSuggestion) => void;
}>;

type LetterGroup = Readonly<{ letter: string; items: RecipientSuggestion[] }>;

/** Group sorted contacts under their first letter (non-letters under "#"). */
export const groupContactsByLetter = (
  suggestions: ReadonlyArray<RecipientSuggestion>,
): LetterGroup[] => {
  const sorted = [...suggestions].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
  const groups: LetterGroup[] = [];
  for (const suggestion of sorted) {
    const first = suggestion.name.trim().charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : "#";
    const last = groups[groups.length - 1];
    if (last && last.letter === letter) last.items.push(suggestion);
    else groups.push({ letter, items: [suggestion] });
  }
  return groups;
};

/**
 * Full contact list for the Recipient step (Figma 14437:40767), reached by
 * clicking the "Contacts" subheader in the preview. Local search input +
 * alphabetical sections with a letter chip above each group. Only contacts
 * with an address on the selected chain are listed (same `chainId` filter
 * as the preview).
 */
export function RecipientContactsList({ chainId, selectedTicker, onSelect }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { external } = useRecipientSuggestions(search, chainId, selectedTicker);
  const groups = useMemo(() => groupContactsByLetter(external), [external]);

  return (
    <DialogBody
      // `pt-8` so the focused search input's purple ring has clearance from
      // the header — the body has no intrinsic top padding, so without this
      // the top edge of the ring reads as cropped (same fix as the
      // Add-contact dialog).
      className="flex flex-col gap-16 px-24 pt-8 pb-16"
      data-testid="send-recipient-contacts-list"
    >
      <SearchInput
        appearance="plain"
        placeholder={t("newSendFlow.picker.searchContact")}
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoFocus
        data-testid="send-recipient-contacts-search"
      />
      <div className="flex flex-col">
        {groups.map(group => (
          <React.Fragment key={group.letter}>
            {/* Letter chip — Figma 14437:41134: surface-transparent bar,
                body-3-semi-bold muted letter. */}
            <div className="w-full rounded-sm bg-surface-transparent px-8 py-2">
              <p className="body-3-semi-bold text-muted">{group.letter}</p>
            </div>
            {group.items.map(s => (
              <ContactSuggestionRow key={s.id} suggestion={s} onSelect={onSelect} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </DialogBody>
  );
}
