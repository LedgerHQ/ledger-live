import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Spot } from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";

/**
 * Empty state for the right pane of the L4 Contacts page when the
 * selected contact has zero addresses (Figma frame 13922:11258).
 *
 * Renders a centered Lumen `Spot` (with `Plus` icon for "add"
 * affordance), a heading + description, and a primary `Add address`
 * button. The button is intentionally non-wired in L4 — Lumen's
 * hover/pressed states render, click is a no-op pending the
 * L4.1 "Add address" Dialog.
 *
 * TODO(contacts-L4.1): wire `onAddAddress` to a "Register address"
 * Dialog that reuses the L1 form (with the Crypto + Network selectors
 * already added).
 */
export function EmptyAddressState() {
  const { t } = useTranslation();

  return (
    <div
      data-testid="contacts-management-empty-addresses"
      className="flex flex-col items-center justify-center gap-16 w-full py-32"
    >
      <Spot size={56} appearance="icon" icon={Plus} />
      <div className="flex flex-col items-center gap-4 text-center max-w-320">
        <p className="heading-5-semi-bold text-base">
          {t("contactsManagement.emptyAddresses.title")}
        </p>
        <p className="body-3 text-muted">
          {t("contactsManagement.emptyAddresses.description")}
        </p>
      </div>
      <Button
        appearance="base"
        size="md"
        icon={Plus}
        // L4.1 wiring — Lumen still renders hover/pressed without onClick.
        data-testid="contacts-management-empty-add-address"
      >
        {t("contactsManagement.emptyAddresses.cta")}
      </Button>
    </div>
  );
}
