import React from "react";
import type { UseContacts } from "~/renderer/contacts/useContacts";
import type { RunVerb } from "../types";
import RegisterExternalAddressSection from "../forms/RegisterExternalAddressSection";
import RenameContactSection from "../forms/RenameContactSection";
import EditAddressLabelSection from "../forms/EditAddressLabelSection";
import EditAddressSection from "../forms/EditAddressSection";

type Props = {
  contacts: UseContacts;
  run: RunVerb;
};

const ExternalAddressesPanel = ({ contacts, run }: Props) => (
  <div className="flex flex-col gap-24 pt-16 pb-0 px-0 w-full">
    <RegisterExternalAddressSection contacts={contacts} run={run} />
    <RenameContactSection contacts={contacts} run={run} />
    <EditAddressLabelSection contacts={contacts} run={run} />
    <EditAddressSection contacts={contacts} run={run} />
  </div>
);

export default ExternalAddressesPanel;
