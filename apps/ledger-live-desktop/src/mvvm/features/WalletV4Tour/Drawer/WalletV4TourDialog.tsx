import React from "react";
import { Button, Dialog, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { Slides, useSlidesContext } from "LLD/components/Slides";

interface WalletV4TourDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

function ContinueButton() {
  const { goToNext } = useSlidesContext();
  return (
    <div className="px-8 pb-8">
      <Button appearance="base" size="lg" className="w-full" onClick={goToNext}>
        Continue
      </Button>
    </div>
  );
}

export const WalletV4TourDialog = ({ isOpen, onClose }: WalletV4TourDialogProps) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader appearance="extended" title="Wallet V4 Tour" onClose={onClose} />
        <Slides>
          <Slides.Content>
            <Slides.Content.Item>
              <div className="flex flex-col items-center gap-4 p-8">
                <span className="heading-3-semi-bold text-base">Slide 1</span>
                <p className="text-center body-2 text-muted">Placeholder content</p>
              </div>
            </Slides.Content.Item>
            <Slides.Content.Item>
              <div className="flex flex-col items-center gap-4 p-8">
                <span className="heading-3-semi-bold text-base">Slide 2</span>
                <p className="text-center body-2 text-muted">Placeholder content</p>
              </div>
            </Slides.Content.Item>
          </Slides.Content>
          <Slides.Footer>
            <ContinueButton />
          </Slides.Footer>
        </Slides>
      </DialogContent>
    </Dialog>
  );
};
