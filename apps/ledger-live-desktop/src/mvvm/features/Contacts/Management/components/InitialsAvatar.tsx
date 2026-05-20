import React from "react";
import { cn } from "LLD/utils/cn";
import { getAvatarColor } from "../utils/getAvatarColor";
import { getContactInitials } from "../utils/getContactInitials";

/**
 * Circular avatar showing 1–2 uppercase initials derived from the contact
 * name, with a deterministic pastel background per name (see
 * `getAvatarColor`).
 *
 * Lumen's `Avatar` only supports image sources (or a User glyph fallback) at
 * the version pinned in this app — no text/initials mode. This is a local
 * stand-in matching the Figma frame 13802:2833.
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

const SIZE_PX: Record<Size, number> = {
  sm: 40,
  lg: 96,
};

// Typography token for the centered initials.
const TEXT_CLASS: Record<Size, string> = {
  sm: "body-2-semi-bold",
  // 36px / line-height 44, weight 600 — matches the responsive-display/3
  // token used in the Figma details pane avatar.
  lg: "responsive-display-3",
};

export function InitialsAvatar({ name, size }: Props) {
  const initials = getContactInitials(name);
  const bg = getAvatarColor(name);
  const px = SIZE_PX[size];

  return (
    <div
      role="img"
      aria-label={name}
      data-testid="contacts-management-initials-avatar"
      style={{ width: px, height: px, backgroundColor: bg }}
      className={cn(
        "shrink-0 rounded-full flex items-center justify-center select-none",
        // Subtle white-10% inner ring picked up from the Figma frame's
        // border-[rgba(255,255,255,0.1)] on the 96px avatar — applied to
        // both sizes for visual consistency on dark canvases.
        "border border-[rgba(255,255,255,0.1)]",
        // Text always black on these pastel backgrounds, matching the Figma.
        "text-black",
        TEXT_CLASS[size],
      )}
    >
      {initials}
    </div>
  );
}
