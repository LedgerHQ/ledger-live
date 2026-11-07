import React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";

type Props = Readonly<{
  title: string;
  confirmLabel: string;
  canConfirm: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
  testID: string;
}>;

export function SignReviewDialog({
  title,
  confirmLabel,
  canConfirm,
  onConfirm,
  onCancel,
  children,
  testID,
}: Props) {
  const onOpenChange = (open: boolean) => {
    if (!open) onCancel();
  };

  return (
    <Dialog open onOpenChange={onOpenChange} height="fit">
      <DialogContent aria-describedby={undefined} className="w-[400px]" data-testid={testID}>
        <DialogHeader density="expanded" title={title} onClose={onCancel} />
        <DialogBody className="flex flex-col gap-16">{children}</DialogBody>
        <DialogFooter>
          <Button
            className="w-full"
            appearance="base"
            size="lg"
            disabled={!canConfirm}
            onClick={onConfirm}
            data-testid={`${testID}-confirm`}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
