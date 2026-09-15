import React from "react";
import { Button, Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { ExternalLink, Globe } from "@ledgerhq/lumen-ui-react/symbols";
import { DialogBackgroundToneProvider, InfoState } from "@shared/ui-info-state";
import type { CurrencyRegionRestrictedDialogViewProps } from "./useCurrencyRegionRestrictedDialogViewModel";

const CurrencyRegionRestrictedDialogView = ({
  isOpen,
  title,
  description,
  learnMoreLabel,
  closeLabel,
  onClose,
  onLearnMore,
}: CurrencyRegionRestrictedDialogViewProps) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} height="fit">
      <DialogContent aria-describedby={undefined}>
        <DialogBackgroundToneProvider>
          <DialogHeader density="compact" onClose={onClose} />
          <DialogBody>
            <InfoState
              preset="spot"
              spotProps={{ icon: Globe }}
              backgroundTone="info"
              size="hug"
              title={title}
              description={description}
              content={
                <div className="flex flex-col gap-16">
                  <Button
                    appearance="base"
                    size="lg"
                    isFull
                    icon={ExternalLink}
                    onClick={onLearnMore}
                    data-testid="region-restricted-learn-more"
                  >
                    {learnMoreLabel}
                  </Button>
                  <Button
                    appearance="gray"
                    size="lg"
                    isFull
                    onClick={onClose}
                    data-testid="region-restricted-close"
                  >
                    {closeLabel}
                  </Button>
                </div>
              }
            />
          </DialogBody>
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
};

export default CurrencyRegionRestrictedDialogView;
