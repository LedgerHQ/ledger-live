import React from "react";
import { cn } from "LLD/utils/cn";
import { getContactInitials } from "../utils/getContactInitials";

/**
 * Circular avatar showing 1–2 uppercase initials derived from the contact
 * name.
 *
 * Lumen's `Avatar` only supports image sources (or a User glyph fallback) at
 * the version pinned in this app — no text/initials mode. This is a local
 * stand-in.
 *
 * TODO(lumen-adoption): replace with the official Lumen initials avatar
 * once it ships. See `apps/ledger-live-desktop/docs/contacts.md` (Lumen-only
 * policy + adoption channel).
 */

type Size = "sm" | "lg";

type Props = {
  name: string;
  size: Size;
};

const sizeClasses: Record<Size, string> = {
  // 40px circle, body-2 typography for the list rows
  sm: "w-40 h-40 body-2-semi-bold",
  // 80px circle, heading-4 typography for the details pane header
  lg: "w-80 h-80 heading-4-semi-bold",
};

export function InitialsAvatar({ name, size }: Props) {
  const initials = getContactInitials(name);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0 rounded-full bg-muted-transparent text-base",
        "flex items-center justify-center select-none",
        sizeClasses[size],
      )}
      data-testid="contacts-management-initials-avatar"
    >
      {initials}
    </div>
  );
}
