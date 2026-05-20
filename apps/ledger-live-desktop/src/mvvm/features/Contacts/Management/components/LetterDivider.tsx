import React from "react";

type Props = {
  letter: string;
};

/**
 * Single-letter section heading for the alphabetical contact groups in
 * the list pane.
 *
 * Intentionally lighter than Lumen's `Subheader`, which is designed for
 * action-bearing section heads with optional counts/icons. This is just a
 * compact letter label.
 */
export function LetterDivider({ letter }: Props) {
  return (
    <div
      role="presentation"
      className="px-12 py-4 micro-bold text-muted uppercase"
    >
      {letter}
    </div>
  );
}
