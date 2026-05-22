import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";

/**
 * Empty state for the right pane of the L4 Contacts page when the
 * selected contact has zero addresses (Figma frame 13922:11258).
 *
 * Design is intentionally minimal — no icon, no description, no Spot:
 *   - Title "No addresses for this contact" in `heading-5-semi-bold`.
 *   - Primary "Add address" Lumen `Button` (appearance="base" — white
 *     pill on the dark canvas).
 *   - Stack is centered horizontally inside the details pane and sits
 *     below the identity block with generous vertical breathing room.
 *
 * The button is non-wired in L4 — Lumen still renders hover/pressed
 * states without `onClick`. Wiring lands in L4.1 alongside the
 * "Add address" Dialog.
 *
 * TODO(contacts-L4.1): hook the CTA up to the address-registration
 * flow (reuses the L1 form's Crypto + Network selectors + the
 * cryptoMeta sidecar write).
 */
export function EmptyAddressState() {
  const { t } = useTranslation();

  return (
    <div
      data-testid="contacts-management-empty-addresses"
      className="flex flex-col items-center justify-center gap-24 w-full py-48"
    >
      <p className="heading-5-semi-bold text-base text-center">
        {t("contactsManagement.emptyAddresses.title")}
      </p>
      <Button
        appearance="base"
        size="md"
        // L4.1 wiring — Lumen still renders hover/pressed without onClick.
        data-testid="contacts-management-empty-add-address"
      >
        {t("contactsManagement.emptyAddresses.cta")}
      </Button>
    </div>
  );
}
