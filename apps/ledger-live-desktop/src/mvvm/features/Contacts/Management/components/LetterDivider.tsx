import React from "react";

type Props = {
  letter: string;
};

/**
 * Single-letter section heading for the alphabetical contact groups.
 *
 * Styled as a small inline chip matching the Figma frame 13802:2833 — a
 * full-width `bg-surface-transparent` strip with `body-3-semi-bold` text
 * tinted muted. Lumen's `Subheader` was designed for action-bearing
 * section heads (icons, counts), which is heavier than what this single
 * letter needs.
 */
export function LetterDivider({ letter }: Props) {
  return (
    <div
      role="presentation"
      className="w-full px-8 py-2 rounded-sm bg-surface-transparent body-3-semi-bold text-muted"
    >
      {letter}
    </div>
  );
}
