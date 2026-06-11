import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Empty state for the right pane of the L4 Contacts page when the
 * selected contact has zero addresses.
 *
 * Both variants share the same text-only layout (Figma frames
 * `14391:12542` generic / `14391:12773` Me): title "No address yet" in
 * `body-1-semi-bold` + a `body-2` muted line, vertically centered in
 * the space left under the header. NO CTA here — the header's
 * "Add address" pill is the single affordance. Only the body copy
 * differs:
 *   - **Generic** — "Save wallet address to send to {{name}}",
 *     personalized with the contact's display name.
 *   - **Me identity** — the onboarding-flavored explanation ("Save
 *     addresses you own on other exchanges and wallets…"), since the
 *     Me contact is the only one that's always-present with no
 *     addresses on first run.
 */
type Props = {
  /**
   * Display name interpolated into the generic body copy
   * ("Save wallet address to send to {{name}}"). Unused for the Me
   * variant. The recommended contact-naming convention (nickname /
   * first name + initial) keeps the sentence reading naturally.
   */
  contactName?: string;
  /**
   * When true, render the Me-specific body copy. When false (default),
   * render the personalized generic copy.
   */
  isMe?: boolean;
};

export function EmptyAddressState({ contactName = "", isMe = false }: Props = {}) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="contacts-management-empty-addresses"
      // `flex-1` so the container grows to fill the vertical space left
      // under the identity block in `ContactDetails` (a `flex-col`
      // scroll region) and `justify-center` places the copy at the
      // geometric centre of that empty area. `px-24` matches the Figma
      // content inset.
      className="flex flex-1 flex-col items-center justify-center w-full px-24"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="body-1-semi-bold text-base">
          {t(
            isMe
              ? "contactsManagement.emptyAddressesMe.title"
              : "contactsManagement.emptyAddresses.title",
          )}
        </p>
        <p className="body-2 text-muted">
          {isMe
            ? t("contactsManagement.emptyAddressesMe.body")
            : t("contactsManagement.emptyAddresses.body", { name: contactName })}
        </p>
      </div>
    </div>
  );
}
