import React from "react";
import type { AddressParts } from "../../utils/splitAddress";

type RequestReceiveAddressProps = Readonly<{
  addressParts: AddressParts;
}>;

export function RequestReceiveAddress({ addressParts }: RequestReceiveAddressProps) {
  const { start, middle, end } = addressParts;

  return (
    <p className="px-48 text-center break-all" data-testid="pay-card-request-receive-address">
      <span className="body-2-semi-bold text-base">{start}</span>
      <span className="body-2 text-muted">{middle}</span>
      <span className="body-2-semi-bold text-base">{end}</span>
    </p>
  );
}
