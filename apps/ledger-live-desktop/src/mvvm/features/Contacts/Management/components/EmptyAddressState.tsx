import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";

/**
 * Empty state for the right pane of the L4 Contacts page when the
 * selected contact has zero addresses.
 *
 * Two variants picked by the `isMe` flag:
 *   - **Generic** (default, Figma frame 13922:11258) — title-only
 *     "No addresses for this contact" + Add-address button.
 *   - **Me identity** (Figma frame 14165:11906) — title "No addresses"
 *     + a body line explaining the use case ("Save addresses you own
 *     on other exchanges and wallets…") + the same Add-address button.
 *     The Me row deserves the longer explanation because the Me
 *     contact is the only one that's always-present with no addresses
 *     on first run — it's effectively the L4 onboarding surface for
 *     the feature.
 *
 * The button opens the parent-owned `AddAddressDialog`. The parent
 * (`ContactDetails`) holds the open state and passes `onAddAddress`
 * + `isMe` here.
 */
type Props = {
  onAddAddress?: () => void;
  /**
   * When true, render the Me-specific copy + body line. When false
   * (default), render the generic title-only variant used for every
   * other contact.
   */
  isMe?: boolean;
};

export function EmptyAddressState({ onAddAddress, isMe = false }: Props = {}) {
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
      // empty area. `px-48 py-24` matches the Figma spec
      // (`14165:11906`) for the surrounding breathing room.
      className="flex flex-1 flex-col items-center justify-center gap-24 w-full px-48 py-24"
    >
      <div className="flex flex-col items-center gap-8 max-w-360 text-center">
        <p className="heading-5-semi-bold text-base">
          {t(
            isMe
              ? "contactsManagement.emptyAddressesMe.title"
              : "contactsManagement.emptyAddresses.title",
          )}
        </p>
        {isMe && (
          <p className="body-2 text-muted">
            {t("contactsManagement.emptyAddressesMe.body")}
          </p>
        )}
      </div>
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
