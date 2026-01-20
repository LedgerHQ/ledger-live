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

export const MoodIndexDialog = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent data-testid="mood-index-dialog-content">
        <DialogHeader
          appearance="extended"
          title={t("fearAndGreed.dialog.title")}
          onClose={() => setOpen(false)}
        />
        <DialogBody className="body-1 text-base">{t("fearAndGreed.dialog.content")}</DialogBody>
        <DialogFooter className="justify-center">
          <Button
            className="w-full"
            appearance="base"
            size="lg"
            onClick={() => setOpen(false)}
            data-testid="mood-index-dialog-cta"
          >
            {t("fearAndGreed.dialog.cta")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
