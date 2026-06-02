import React from "react";

/**
 * "Rename" glyph used in the L4 contacts menus and dialogs (Figma
 * `13909:3063` row + `13844:10015` action tile).
 *
 * Lumen's symbol set doesn't ship a typography `T+I` letterform, so we
 * inline the stroke paths exported from Figma. Component contract
 * mirrors a Lumen icon — `size` sets the box, `className` lets parents
 * apply color tokens (`text-base`, `text-error`, …) via `currentColor`.
 *
 * The path lives inside a translated `<g>` so the natural `15.625 × 15`
 * letterform sits centred in a `20 × 20` viewBox with ≈2.2 px / 2.5 px
 * padding — matches the visual weight of the sibling Lumen icons
 * (QrCode, ArrowUp, PenEdit, Trash) which all occupy ~75 % of their
 * box.
 */
type IconSize = 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56;

export function RenameLettersIcon({
  size = 20,
  className,
}: {
  size?: IconSize;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g transform="translate(1.4375 1.75)">
        <path
          d="M5.74573 2.41417V14.0833M3.25 14.0833H8.25M10.75 4.91667V3.02987C10.75 2.68396 10.4932 2.41667 10.1937 2.41667H1.30635C0.992511 2.41667 0.75 2.68396 0.75 3.01415V4.88522M15.125 0.75V15.75M16.375 15.75H13.875M16.375 0.75H13.875"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
