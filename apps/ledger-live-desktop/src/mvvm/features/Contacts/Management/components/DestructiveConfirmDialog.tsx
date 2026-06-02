import React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import { Trash } from "@ledgerhq/lumen-ui-react/symbols";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Fired ONLY when the user clicks the destructive button. The host
   * keeps the actual side-effect (the delete itself) in one place
   * (typically the viewmodel) — this shell only owns the confirmation
   * UX.
   */
  onConfirm: () => void;
  /** Heading copy — e.g. `"Delete contact?"`. */
  title: string;
  /** Muted explanatory line under the heading. */
  body: string;
  /** Label for the destructive (red) confirm button. Default: `"Delete"`. */
  confirmLabel?: string;
  /** Label for the dismissive (gray) cancel button. Default: `"Cancel"`. */
  cancelLabel?: string;
  /**
   * Optional root for the `data-testid`s on the dialog body + buttons.
   * Defaults to `contacts-management-destructive-confirm`. Consumers
   * override per dialog so tests can target the right surface
   * (`contacts-management-delete-contact`, `…-delete-address`, …).
   */
  testIdRoot?: string;
};

/**
 * Shared destructive-confirmation dialog used by both
 * `DeleteContactDialog` (Figma `14151:13408`) and
 * `DeleteAddressDialog` (Figma `14152:14729`).
 *
 * The two Figma frames are structurally identical — red Trash badge,
 * centred title + body, Cancel/Delete buttons in a stretch row — so
 * we keep the shell here and let the consumers supply the copy +
 * the actual `onConfirm` callback. Re-using a single shell also
 * means a future style tweak (badge colour, button arrangement…)
 * lands in one place.
 */
export function DestructiveConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  body,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  testIdRoot = "contacts-management-destructive-confirm",
}: Props) {
  const handleConfirm = () => {
    // Close first so the dialog's exit animation runs in parallel
    // with the parent's post-delete re-render — same pattern the
    // other dialogs in this feature use.
    onOpenChange(false);
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} height="fit">
      <DialogContent>
        {/*
          Header carries only the close affordance — the prompt's
          title sits in the body so it can be centred under the
          trash badge per the Figma layout.
        */}
        <DialogHeader title="" onClose={() => onOpenChange(false)} />
        <DialogBody
          scrollbarWidth="auto"
          className="flex flex-col items-center gap-24 px-24 pb-24"
          data-testid={`${testIdRoot}-dialog`}
        >
          {/*
            Trash badge — red icon on a `bg-muted` disc. Hand-rolled
            rather than using Lumen `<Spot appearance="error" />`
            because that variant ships a generic error glyph; the
            Figma calls for a Trash specifically. `text-error` on
            the icon picks up the destructive token via `currentColor`.
          */}
          <div
            className="flex h-56 w-56 items-center justify-center rounded-full bg-muted"
            aria-hidden="true"
          >
            <Trash size={24} className="text-error" />
          </div>

          <div className="flex flex-col items-center gap-8 text-center">
            <h3 className="heading-3-semi-bold text-base">{title}</h3>
            <p className="body-2 text-muted">{body}</p>
          </div>

          <div className="flex w-full items-stretch gap-8">
            <Button
              appearance="gray"
              size="md"
              isFull
              onClick={() => onOpenChange(false)}
              data-testid={`${testIdRoot}-cancel`}
            >
              {cancelLabel}
            </Button>
            <Button
              appearance="red"
              size="md"
              isFull
              onClick={handleConfirm}
              data-testid={`${testIdRoot}-confirm`}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
