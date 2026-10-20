import React from "react";
import { OperationDetailsContactView } from "./OperationDetailsContactView";
import { useOperationDetailsContactViewModel } from "./useOperationDetailsContactViewModel";

type OperationDetailsContactProps = Readonly<{
  address: string;
  currencyId?: string;
}>;

export function OperationDetailsContact({ address, currencyId }: OperationDetailsContactProps) {
  const contact = useOperationDetailsContactViewModel(address, currencyId);
  if (!contact) return null;

  return <OperationDetailsContactView contact={contact} />;
}
