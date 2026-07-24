import React from "react";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { Search } from "@ledgerhq/lumen-ui-react/symbols";

type ContactsSearchNoResultsProps = Readonly<{
  message: string;
}>;

export function ContactsSearchNoResults({
  message,
}: ContactsSearchNoResultsProps): React.ReactNode {
  return (
    <div
      className="flex flex-col items-center justify-center gap-16 py-40"
      data-testid="contacts-search-no-results"
    >
      <Spot appearance="icon" icon={Search} />
      <span className="heading-4-semi-bold text-base">{message}</span>
    </div>
  );
}
