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
  /**
   * Stable seed for the background-colour hash. When omitted we fall
   * back to hashing `name`, which used to be the original behaviour
   * but caused the avatar to flicker on every rename.
   *
   * `useManagementViewModel` supplies this for every merged contact:
   * `groupHandleHex || underlying-sidecar-key`, so the colour stays
   * pinned to the contact's identity across L4 renames, device
   * renames, and sidecar → canonical promotion.
   */
  colorKey?: string;
};

const SIZE_PX: Record<Size, number> = {
  sm: 40,
  lg: 72,
};

// Typography token for the centered initials.
const TEXT_CLASS: Record<Size, string> = {
  sm: "body-2-semi-bold",
  // `heading/2-semi-bold` matches the Figma spec for the details-pane
  // avatar at 72px. (Previously 96px / `heading/1-semi-bold` — both
  // bumped down a step.)
  lg: "heading-2-semi-bold",
};

export function InitialsAvatar({ name, size, colorKey }: Props) {
  const initials = getContactInitials(name);
  // Hash off the stable colour seed when supplied — keeps the bg
  // pinned across renames. Falls back to `name` for callers that
  // don't have an enrichment step (tests, the L1 panel).
  const bg = getAvatarColor(colorKey ?? name);
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
