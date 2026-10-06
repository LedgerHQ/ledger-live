import React from "react";
import { OperationDetailsContactView } from "./OperationDetailsContactView";
import { useOperationDetailsContactViewModel } from "./useOperationDetailsContactViewModel";

type OperationDetailsContactProps = Readonly<{
  address: string;
  currencyId?: string;
  children: (matchedContact: boolean) => React.ReactNode;
}>;

export function OperationDetailsContact({
  address,
  currencyId,
  children,
}: OperationDetailsContactProps) {
  const contact = useOperationDetailsContactViewModel(address, currencyId);

  return (
    <div className="flex w-fit min-w-0 max-w-full flex-col items-end self-end gap-4">
      {contact ? <OperationDetailsContactView contact={contact} /> : null}
      {children(contact !== undefined)}
    </div>
  );
}
