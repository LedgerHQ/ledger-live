import React from "react";
import { useContacts } from "~/renderer/contacts/useContacts";
import OverviewPanel from "./panels/OverviewPanel";
import ExternalAddressesPanel from "./panels/ExternalAddressesPanel";
import LedgerAccountsPanel from "./panels/LedgerAccountsPanel";
import StoragePanel from "./panels/StoragePanel";
import type { ContactsPanelViewProps } from "./types";

const ContactsPanelView = ({ subView, setSubView, run }: ContactsPanelViewProps) => {
  const contacts = useContacts();

  switch (subView) {
    case "overview":
      return <OverviewPanel wallet={contacts.wallet} setSubView={setSubView} />;
    case "external":
      return <ExternalAddressesPanel contacts={contacts} run={run} />;
    case "accounts":
      return <LedgerAccountsPanel contacts={contacts} run={run} />;
    case "storage":
      return <StoragePanel contacts={contacts} />;
  }
};

export default ContactsPanelView;
