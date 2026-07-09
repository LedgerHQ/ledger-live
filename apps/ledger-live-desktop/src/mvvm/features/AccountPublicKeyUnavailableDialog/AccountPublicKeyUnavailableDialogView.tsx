import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider } from "LLD/components/DialogBackgroundGradient";
import { InfoState } from "LLD/components/InfoState";
import type { AccountPublicKeyUnavailableDialogViewProps } from "./useAccountPublicKeyUnavailableDialogViewModel";

const AccountPublicKeyUnavailableDialogView = ({
  isOpen,
  title,
  description,
  ctaLabel,
  learnMoreLabel,
  onClose,
  onLearnMore,
}: AccountPublicKeyUnavailableDialogViewProps) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} height="fit">
      <DialogContent aria-describedby={undefined} className="w-[400px] bg-base p-0">
        <DialogBackgroundToneProvider>
          <DialogHeader density="compact" onClose={onClose} className="!mb-0" />
          <DialogBody className="!mb-0 flex min-h-0 flex-col px-24 pb-24">
            <InfoState
              preset="error"
              size="hug"
              title={title}
              description={description}
              primaryCta={{ label: ctaLabel, onPress: onClose }}
              secondaryCta={{ label: learnMoreLabel, onPress: onLearnMore }}
            />
          </DialogBody>
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
};

export default AccountPublicKeyUnavailableDialogView;
