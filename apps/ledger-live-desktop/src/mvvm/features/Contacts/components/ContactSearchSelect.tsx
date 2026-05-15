import React, { useMemo, useRef, useState } from "react";
import { SearchInput } from "@ledgerhq/lumen-ui-react";

export type ContactPickResult =
  | { mode: "existing"; name: string }
  | { mode: "new"; name: string };

type ContactSummary = { name: string; entryCount: number };

type Props = {
  /** Existing contacts in the local wallet — used to populate the popdown matches. */
  contacts: ContactSummary[];
  /** Free-text value the user is typing. */
  value: string;
  /** Fires on every keystroke + on match selection. The `mode` distinguishes selecting a known contact from typing a new name. */
  onChange: (result: ContactPickResult) => void;
  placeholder?: string;
  disabled?: boolean;
};

const ContactSearchSelect = ({
  contacts,
  value,
  onChange,
  placeholder,
  disabled,
}: Props) => {
  const [focused, setFocused] = useState(false);
  // Delay blur so a click on a popdown item lands before we hide it.
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter(c => c.name.toLowerCase().includes(query));
  }, [contacts, value]);

  const exactMatch = useMemo(
    () => contacts.find(c => c.name === value),
    [contacts, value],
  );

  const open = focused && matches.length > 0;

  return (
    <div className="relative w-full">
      <SearchInput
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e =>
          onChange({
            mode: contacts.some(c => c.name === e.target.value) ? "existing" : "new",
            name: e.target.value,
          })
        }
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          setFocused(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setFocused(false), 100);
        }}
      />
      {open && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 z-10 mt-4 max-h-208 overflow-auto rounded-sm border border-base bg-surface shadow-md"
        >
          {matches.map(c => (
            <li
              key={c.name}
              role="option"
              aria-selected={exactMatch?.name === c.name}
              onMouseDown={e => {
                // Use mousedown so we fire before the input blurs.
                e.preventDefault();
                onChange({ mode: "existing", name: c.name });
                setFocused(false);
              }}
              className="cursor-pointer px-12 py-8 hover:bg-muted-transparent body-2 text-base flex justify-between gap-8"
            >
              <span className="truncate">{c.name}</span>
              <span className="body-3 text-muted shrink-0">
                {c.entryCount} {c.entryCount === 1 ? "entry" : "entries"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContactSearchSelect;
