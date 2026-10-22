import React, { useState, type ReactNode } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";

type DefinitionProps = Readonly<{
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>;

export function Definition({ children, open, onOpenChange }: DefinitionProps) {
  const { t } = useTranslation();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent data-testid="fear-and-greed-dialog-content">
        <DialogHeader
          density="expanded"
          title={t("fearAndGreed.dialog.title")}
          onClose={() => setOpen(false)}
        />
        <DialogBody className="flex flex-col gap-24">
          <p className="body-1 text-base">{t("fearAndGreed.dialog.content")}</p>
          <p className="body-4 text-muted">{t("fearAndGreed.dialog.disclaimer")}</p>
        </DialogBody>
        <DialogFooter className="justify-center">
          <Button
            className="w-full"
            appearance="base"
            size="lg"
            onClick={() => setOpen(false)}
            data-testid="fear-and-greed-dialog-cta"
          >
            {t("fearAndGreed.dialog.cta")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
