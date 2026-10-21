import React from "react";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { AdvancedLogsContent } from "../../AdvancedLogsContent";
import type { AdvancedLogsContentProps } from "../../AdvancedLogsContent/types";

type Props = Readonly<{
  title: string;
  advancedLogs: AdvancedLogsContentProps;
  onBack: () => void;
  onClose: () => void;
}>;

export function AdvancedLogsStep({ title, advancedLogs, onBack, onClose }: Props) {
  return (
    <>
      <DialogHeader density="expanded" title={title} onBack={onBack} onClose={onClose} />
      <DialogBody>
        <AdvancedLogsContent {...advancedLogs} />
      </DialogBody>
    </>
  );
}
