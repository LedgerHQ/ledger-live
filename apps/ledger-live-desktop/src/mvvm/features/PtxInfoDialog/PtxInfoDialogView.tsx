import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogBody, Link } from "@ledgerhq/lumen-ui-react";
import type { PtxInfoDialogViewProps } from "./usePtxInfoDialogViewModel";

const PtxInfoDialogView = ({
  isOpen,
  title,
  message,
  linkText,
  onClose,
  onLinkPress,
}: PtxInfoDialogViewProps) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent aria-describedby={undefined}>
      <DialogHeader appearance="compact" title={title} onClose={onClose} />
      <DialogBody className="gap-0 px-24 pb-24">
        <p className="body-1 text-base whitespace-pre-line">
          {message}

          {linkText && onLinkPress && (
            <Link
              onClick={onLinkPress}
              appearance="accent"
              underline
              className="pl-4 cursor-pointer"
            >
              {linkText}
            </Link>
          )}
        </p>
      </DialogBody>
    </DialogContent>
  </Dialog>
);

export default PtxInfoDialogView;
