import React from "react";
import type { AddressParts } from "../../../utils/splitAddress";

type AddressTextProps = Readonly<{
  addressParts: AddressParts;
}>;

export function AddressText({ addressParts }: AddressTextProps) {
  const { start, middle, end } = addressParts;

  return (
    <p
      className="w-256 break-all text-center body-2 text-muted"
      data-testid="receive-address-address"
    >
      <span className="text-base">{start}</span>
      {middle}
      <span className="text-base">{end}</span>
    </p>
  );
}
