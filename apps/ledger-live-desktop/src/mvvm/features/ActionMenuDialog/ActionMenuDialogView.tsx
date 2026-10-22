import React from "react";
import { Title as DialogTitle } from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Download, Plus } from "@ledgerhq/lumen-ui-react/symbols";
import type { ActionMenuDialogIcon } from "@ledgerhq/live-common/wallet-api/validation/actionMenuDialogParams";
import type { ActionMenuDialogViewProps } from "./useActionMenuDialogViewModel";

const ICONS = {
  deposit: Plus,
  withdraw: Download,
} as const satisfies Record<ActionMenuDialogIcon, unknown>;

const ActionMenuDialogView = ({
  isOpen,
  options,
  onSelect,
  onDismiss,
}: Readonly<ActionMenuDialogViewProps>) => {
  const { t } = useTranslation();

  const handleOpenChange = (open: boolean) => {
    if (!open) onDismiss();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="sr-only">{t("actionMenuDialog.a11yTitle")}</DialogTitle>
        <DialogHeader density="compact" onClose={onDismiss} className="mb-0!" />
        <div className="flex flex-col px-16">
          {options.map(({ id, label, icon }) => (
            <ListItem
              key={id}
              density="expanded"
              data-testid={`action-menu-option-${id}`}
              onClick={() => onSelect(id)}
            >
              <ListItemLeading>
                <Spot icon={ICONS[icon]} size={48} />
                <ListItemContent>
                  <ListItemTitle>{label}</ListItemTitle>
                </ListItemContent>
              </ListItemLeading>
            </ListItem>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActionMenuDialogView;
