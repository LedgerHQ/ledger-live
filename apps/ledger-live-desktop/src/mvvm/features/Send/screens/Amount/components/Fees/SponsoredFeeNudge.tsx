import React from "react";
import { Tag } from "@ledgerhq/lumen-ui-react";

export type SponsoredFeeNudgeProps = Readonly<{
  available: boolean;
  selected: boolean;
  label: string | null;
  /** Opens the fee payment step; the network fees value is its trigger while `available`. */
  onOpen: () => void;
}>;

export function SponsoredFeeNudge({
  available,
  selected,
  label,
}: Omit<SponsoredFeeNudgeProps, "onOpen">) {
  if (!available || !label) {
    return null;
  }

  return selected ? (
    <Tag
      appearance="success"
      size="sm"
      label={label}
      data-testid="send-sponsored-fee-saved-badge"
    />
  ) : (
    <Tag appearance="gray" size="sm" label={label} data-testid="send-sponsored-fee-nudge" />
  );
}
