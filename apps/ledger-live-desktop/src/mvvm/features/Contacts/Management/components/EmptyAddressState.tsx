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
 * The button opens the parent-owned `AddAddressDialog`. The parent
 * (`ContactDetails`) holds the open state and passes `onAddAddress`
 * here.
 */
type Props = {
  onAddAddress?: () => void;
};

export function EmptyAddressState({ onAddAddress }: Props = {}) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="contacts-management-empty-addresses"
      // `flex-1` so the container grows to fill the vertical space
      // left under the identity block in `ContactDetails` (which is a
      // `flex-col h-full` parent). Without it, `justify-center` has no
      // height to distribute and the content sits flush against the
      // identity block. `items-center` + `justify-center` then place
      // the title + button at the geometric centre of the available
      // empty area (Figma frame 13922:11258).
      className="flex flex-1 flex-col items-center justify-center gap-24 w-full"
    >
      <p className="heading-5-semi-bold text-base text-center">
        {t("contactsManagement.emptyAddresses.title")}
      </p>
      <Button
        appearance="base"
        size="md"
        onClick={onAddAddress}
        data-testid="contacts-management-empty-add-address"
      >
        {t("contactsManagement.emptyAddresses.cta")}
      </Button>
    </div>
  );
}
