import React from "react";
import type { AddressParts } from "../../utils/splitAddress";

type RequestReceiveAddressProps = Readonly<{
  addressParts: AddressParts;
}>;

export function RequestReceiveAddress({ addressParts }: RequestReceiveAddressProps) {
  const { start, middle, end } = addressParts;

  return (
    <p className="break-all text-center pl-48 pr-48" data-testid="pay-request-receive-address">
      <span className="body-2-semi-bold text-base">{start}</span>
      <span className="body-2 text-muted">{middle}</span>
      <span className="body-2-semi-bold text-base">{end}</span>
    </p>
  );
}
