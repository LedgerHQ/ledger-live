import React from "react";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { AdvancedLogsContent } from "../../AdvancedLogsContent";
import type { AccountSettingsEventHandler } from "../../../logic/accountSettingsEvent";
import type { AdvancedLogsContentProps } from "../../AdvancedLogsContent/types";

type Props = Readonly<{
  title: string;
  advancedLogs: AdvancedLogsContentProps;
  onBack: () => void;
  onClose: () => void;
  onEvent?: AccountSettingsEventHandler;
}>;

export function AdvancedLogsStep({ title, advancedLogs, onBack, onClose, onEvent }: Props) {
  return (
    <>
      <DialogHeader density="expanded" title={title} onBack={onBack} onClose={onClose} />
      <DialogBody>
        <AdvancedLogsContent {...advancedLogs} onEvent={onEvent} />
      </DialogBody>
    </>
  );
}
