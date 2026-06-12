import React from "react";
import { cn } from "LLD/utils/cn";
import { getAvatarColor } from "../utils/getAvatarColor";
import { getContactInitials } from "../utils/getContactInitials";
import { getContactPhoto, useContactPhotos } from "../utils/contactPhoto";

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

type Size = "xs" | "sm" | "md" | "lg";

type Props = {
  name: string;
  size: Size;
  /**
   * Stable seed for the background-colour hash. When omitted we fall
   * back to hashing `name`, which used to be the original behaviour
   * but caused the avatar to flicker on every rename.
   *
   * `useManagementViewModel` supplies this for every merged contact:
   * the Me identity is pinned to the literal `"me"` key, a registered
   * contact uses its device-issued `groupHandleHex`, and a local-only
   * stub uses its `name`. So the colour stays pinned across the Me
   * rename path and the on-device rename path.
   */
  colorKey?: string;
};

const SIZE_PX: Record<Size, number> = {
  // 24px — inline avatar inside the Send flow's "To:" input (Figma
  // frame 14442:16458).
  xs: 24,
  sm: 40,
  // 48px — the condensed sticky header on the details pane (Figma
  // frame 14397:13884).
  md: 48,
  lg: 72,
};

// Typography token for the centered initials.
const TEXT_CLASS: Record<Size, string> = {
  // Smallest token on the scale — 1–2 initials inside a 24px disc.
  xs: "body-3-semi-bold",
  sm: "body-2-semi-bold",
  // Figma scales the condensed avatar's initials to ~18.7px —
  // `heading/5-semi-bold` (18px) is the closest token.
  md: "heading-5-semi-bold",
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

  // A picture uploaded via the Add-contact dialog (cosmetic
  // `contactPhoto` sidecar, keyed by contact name) takes precedence
  // over the initials. The lookup simply misses for non-contact
  // callers, so they keep the initials rendering.
  const photos = useContactPhotos();
  const photo = getContactPhoto(photos, name);
  if (photo !== undefined) {
    return (
      <img
        src={photo}
        alt={name}
        data-testid="contacts-management-photo-avatar"
        style={{ width: px, height: px }}
        className="shrink-0 rounded-full object-cover select-none border border-[rgba(255,255,255,0.1)]"
      />
    );
  }

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
