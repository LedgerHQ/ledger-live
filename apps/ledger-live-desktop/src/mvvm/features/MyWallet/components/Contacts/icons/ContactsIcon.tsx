import React from "react";

/**
 * Local "Contacts" glyph for the user-menu popover row.
 *
 * Lumen does not currently ship a Contacts symbol — the closest match in
 * `@ledgerhq/lumen-ui-react/symbols` is `GroupUsers`, which is visually
 * different from the icon specified in Figma frame 13802-2727.
 *
 * TODO(lumen-adoption): replace this with the official Lumen Contacts
 * symbol once it lands. The swap should be a one-import diff in
 * `ContactsView.tsx`. See the project rule in
 * `apps/ledger-live-desktop/docs/contacts.md` (Lumen-only policy).
 *
 * The component intentionally mirrors the Lumen icon API
 * (`{ size?: IconSize; className?: string }`) so `Spot` consumes it as
 * if it were a first-party symbol.
 */

// Mirrors `IconSize` from `@ledgerhq/lumen-ui-react`'s internal Icon types,
// which is not re-exported via the public `./symbols` entry point.
type IconSize = 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56;

export type ContactsIconProps = {
  size?: IconSize;
  className?: string;
};

export function ContactsIcon({ size = 20, className }: ContactsIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M16 3H18.5C19.6046 3 20.5 3.89543 20.5 5V19C20.5 20.1046 19.6046 21 18.5 21H16M16 21H5.99788C4.89769 20.99 3.99753 20.0995 4.00753 18.9989V4.99118C4.00753 3.89057 4.89769 2.99008 6.00789 3.00008H16.0097C17.1099 3.00008 18 3.87056 18 4.98117V18.9989C17.99 20.0995 17.1002 21 16 21ZM20 7.5H18M20 12H18M20 16.5H18M14.5 16C14.3253 15.5796 14.0632 15.1915 13.7247 14.8896C13.1459 14.3614 12.4033 14.0703 11.628 14.0703H10.3721C9.58583 14.0703 8.84324 14.3506 8.27538 14.8789C7.93685 15.1807 7.67475 15.558 7.50003 15.9784M12.2559 8.52823C12.9439 9.20739 12.9439 10.3178 12.2559 10.9969C11.557 11.6761 10.4322 11.6761 9.74419 10.9969C9.04528 10.307 9.04528 9.19661 9.74419 8.51745C10.4322 7.82752 11.557 7.82752 12.245 8.51745"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
