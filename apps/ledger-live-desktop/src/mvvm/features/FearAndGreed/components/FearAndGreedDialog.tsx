import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogHeader,
  DialogFooter,
  DialogContent,
  DialogBody,
  Button,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";

export const FearAndGreedDialog = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
};
