import React from "react";
import type { UseContacts } from "~/renderer/contacts/useContacts";
import type { RunVerb } from "../types";
import RegisterLedgerAccountSection from "../forms/RegisterLedgerAccountSection";

type Props = {
  contacts: UseContacts;
  run: RunVerb;
};

const LedgerAccountsPanel = ({ contacts, run }: Props) => (
  <div className="flex flex-col gap-24 pt-16 pb-0 px-0 w-full">
    <RegisterLedgerAccountSection contacts={contacts} run={run} />
  </div>
);

export default LedgerAccountsPanel;
