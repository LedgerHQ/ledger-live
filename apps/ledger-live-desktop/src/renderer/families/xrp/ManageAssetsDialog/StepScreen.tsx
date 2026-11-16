import React from "react";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";

type Props = Readonly<{
  title?: string;
  description?: string;
  onBack?: () => void;
  onClose: () => void;
  children: React.ReactNode;
}>;

export function StepScreen({ title, description, onBack, onClose, children }: Props) {
  if (!title) {
    return (
      <>
        <DialogHeader density="compact" onBack={onBack} onClose={onClose} className="!mb-0" />
        <DialogBody className="!mb-0 flex min-h-0 flex-col px-24 pb-24">{children}</DialogBody>
      </>
    );
  }

  return (
    <>
      <DialogHeader
        density="expanded"
        title={title}
        description={description}
        onBack={onBack}
        onClose={onClose}
      />
      <DialogBody className="flex flex-col gap-24 pb-24">{children}</DialogBody>
    </>
  );
}
