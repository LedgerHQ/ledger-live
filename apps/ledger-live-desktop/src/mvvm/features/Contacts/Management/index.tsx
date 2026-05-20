import React from "react";
import { Navigate } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import { contactsAlphaSelector } from "~/renderer/reducers/settings";
import { ManagementView } from "./ManagementView";
import { useManagementViewModel } from "./hooks/useManagementViewModel";

/**
 * L4 Contacts management page.
 *
 * Pure consumer of the frozen `useContacts()` boundary (read-only on the
 * wallet snapshot for now — no DMK calls). The L1 dev panel under
 * `mvvm/features/Contacts/` stays mounted in parallel as a dev tool; this
 * page is the designer-led, user-facing surface.
 *
 * Alpha gate is enforced here at the page level (not at route
 * registration) so flipping `contactsAlpha` off mid-session immediately
 * redirects users away — they don't keep seeing a frozen view of the
 * surface from before the toggle.
 */
export function ContactsManagementPage() {
  const contactsAlpha = useSelector(contactsAlphaSelector);
  const viewModel = useManagementViewModel();

  if (!contactsAlpha) return <Navigate to="/" replace />;
  return <ManagementView {...viewModel} />;
}

export default ContactsManagementPage;
