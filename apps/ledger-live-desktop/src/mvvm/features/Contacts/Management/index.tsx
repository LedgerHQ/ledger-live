import React from "react";
import { ManagementView } from "./ManagementView";
import { useManagementViewModel } from "./hooks/useManagementViewModel";

/**
 * L4 Contacts management page.
 *
 * Pure consumer of the frozen `useContacts()` boundary (read-only on the
 * wallet snapshot for now — no DMK calls). The L1 dev panel under
 * `mvvm/features/Contacts/` stays mounted in parallel as a dev tool (gated
 * behind the "Show Contacts test panel" developer setting); this page is
 * the designer-led, user-facing surface and is always available.
 */
export function ContactsManagementPage() {
  const viewModel = useManagementViewModel();

  return <ManagementView {...viewModel} />;
}

export default ContactsManagementPage;
