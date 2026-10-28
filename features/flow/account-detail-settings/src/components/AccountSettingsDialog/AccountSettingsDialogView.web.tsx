import React from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { AdvancedLogsStep } from "./steps/AdvancedLogsStep";
import { ChangeNameStep } from "./steps/ChangeNameStep";
import { MenuStep } from "./steps/MenuStep";
import { RemoveStep } from "./steps/RemoveStep";
import type { AccountSettingsDialogViewProps } from "./types";

function getAriaLabel({
  step,
  title,
  changeNameTitle,
  advancedLogsTitle,
}: AccountSettingsDialogViewProps): string {
  switch (step) {
    case "changeName":
      return changeNameTitle;
    case "advancedLogs":
      return advancedLogsTitle;
    case "menu":
    case "remove":
      return title;
  }
}

function StepContent(props: AccountSettingsDialogViewProps) {
  switch (props.step) {
    case "menu":
      return (
        <MenuStep
          title={props.title}
          accountName={props.accountName}
          onClose={props.onClose}
          onShowChangeName={props.onShowChangeName}
          onShowAdvancedLogs={props.onShowAdvancedLogs}
          explorerUrl={props.explorerUrl}
          onShowRemove={props.onShowRemove}
        />
      );
    case "changeName":
      return (
        <ChangeNameStep
          title={props.changeNameTitle}
          description={props.changeNameDescription}
          accountName={props.accountName}
          nameMaxLength={props.nameMaxLength}
          isNameEditDisabled={props.isNameEditDisabled}
          onBack={props.onShowMenu}
          onClose={props.onClose}
          onConfirmName={props.onConfirmName}
        />
      );
    case "advancedLogs":
      return (
        <AdvancedLogsStep
          title={props.advancedLogsTitle}
          advancedLogs={props.advancedLogs}
          onBack={props.onShowMenu}
          onClose={props.onClose}
        />
      );
    case "remove":
      return <RemoveStep onClose={props.onClose} onConfirmRemove={props.onConfirmRemove} />;
  }
}

export function AccountSettingsDialogView(props: AccountSettingsDialogViewProps) {
  const { isOpen, onClose, onShowMenu, testID } = props;

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-label={getAriaLabel(props)}
        aria-labelledby={undefined}
        aria-describedby={undefined}
        onCloseAutoFocus={onShowMenu}
        data-testid={testID}
      >
        <DialogBackgroundToneProvider>
          <StepContent {...props} />
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
