import React, { ReactNode, useState } from "react";
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

export const GlobalMarketCapDialog = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent data-testid="global-market-cap-dialog-content">
        <DialogHeader
          density="expanded"
          title={t("marketCapCard.dialog.title")}
          onClose={() => setOpen(false)}
        />
        <DialogBody className="flex flex-col gap-24">
          <p className="body-1 text-base">{t("marketCapCard.dialog.content")}</p>
        </DialogBody>
        <DialogFooter className="justify-center">
          <Button
            className="w-full"
            appearance="base"
            size="lg"
            onClick={() => setOpen(false)}
            data-testid="global-market-cap-dialog-cta"
          >
            {t("marketCapCard.dialog.cta")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
