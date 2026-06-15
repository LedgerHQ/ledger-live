import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Selects the wording. `"contact"` (default) for an external address-book
   * entry; `"account"` for an own Ledger account (the CryptoAddresses rename
   * flow) — same presentation, "contact" → "account" in the copy.
   */
  variant?: "contact" | "account";
};

/**
 * Informational dialog shown when an address-book edit fails because the
 * contact/account was registered under a different seed (device returns
 * `SW 0x6982`; see `isSeedMismatchError`). Structurally mirrors
 * `DestructiveConfirmDialog` — same `bg-muted` badge, centred title + body —
 * but reads as *informational* rather than destructive:
 *   - the neutral `Information` glyph (`text-muted`) instead of a red Trash, and
 *   - a single dismiss button (there's nothing to retry on the wrong device, so
 *     dismissing simply closes the whole edit flow back to the details page).
 */
export function SeedMismatchInfoDialog({ open, onOpenChange, variant = "contact" }: Props) {
  const { t } = useTranslation();
  const copyKey =
    variant === "account"
      ? {
          title: "contactsManagement.seedMismatchDialog.accountTitle",
          body: "contactsManagement.seedMismatchDialog.accountBody",
        }
      : {
          title: "contactsManagement.seedMismatchDialog.title",
          body: "contactsManagement.seedMismatchDialog.body",
        };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fit">
      <DialogContent>
        {/* Header carries only the close affordance — the title sits in the
            body so it can be centred under the badge, per the delete-dialog
            layout this mirrors. */}
        <DialogHeader title="" onClose={() => onOpenChange(false)} />
        <DialogBody
          scrollbarWidth="auto"
          className="flex flex-col items-center gap-24 px-24 pb-24"
          data-testid="contacts-management-seed-mismatch-dialog"
        >
          {/* Neutral info badge — `Information` on a `bg-muted` disc. `text-muted`
              (not `text-error`) keeps it informational, not alarming. */}
          <div
            className="flex h-56 w-56 items-center justify-center rounded-full bg-muted"
            aria-hidden="true"
          >
            <Information size={24} className="text-muted" />
          </div>

          <div className="flex flex-col items-center gap-8 text-center">
            <h3 className="heading-3-semi-bold text-base">{t(copyKey.title)}</h3>
            <p className="body-2 text-muted">{t(copyKey.body)}</p>
          </div>

          <Button
            appearance="base"
            size="md"
            isFull
            onClick={() => onOpenChange(false)}
            data-testid="contacts-management-seed-mismatch-dismiss"
          >
            {t("contactsManagement.seedMismatchDialog.dismiss")}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
