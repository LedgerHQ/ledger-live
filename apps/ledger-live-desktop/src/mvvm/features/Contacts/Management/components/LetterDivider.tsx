import React from "react";

type Props = {
  letter: string;
};

/**
 * Single-letter section heading for the alphabetical contact groups.
 *
 * Styled as a small inline chip matching the Figma frame 13802:47227:
 * full-width `bg-surface-transparent` strip with `body-3-semi-bold` text
 * tinted muted, padding `px-8 py-2`, radius `xs` (4px, the Lumen
 * `--border-radius-xs` token — distinct from `sm` which is 8px).
 *
 * Lumen's `Subheader` was designed for action-bearing section heads
 * (icons, counts) — heavier than what a single letter needs.
 */
export function LetterDivider({ letter }: Props) {
  return (
    <div
      role="presentation"
      className="w-full px-8 py-2 rounded-xs bg-surface-transparent body-3-semi-bold text-muted"
    >
      {letter}
    </div>
  );
}
