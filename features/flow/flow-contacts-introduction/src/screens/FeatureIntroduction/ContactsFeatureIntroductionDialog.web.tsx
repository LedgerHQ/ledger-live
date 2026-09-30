import React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import type { ContactsFeatureIntroduction } from "../../state/types";
import { useContactsFeatureIntroductionActions } from "./useContactsFeatureIntroductionActions";
import { CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE } from "./assets";
import { ContactsFeatureIntroductionDialogContent } from "./ContactsFeatureIntroductionDialogContent.web";

export function ContactsFeatureIntroductionDialog({
  isOpen,
  title,
  highlights,
  primaryActionLabel,
  heroImageSrc,
  onComplete,
  onClose: onCloseCallback,
}: ContactsFeatureIntroduction): React.ReactNode {
  const { complete, onClose } = useContactsFeatureIntroductionActions({
    isOpen,
    onComplete,
    onClose: onCloseCallback,
  });
  const heroImage = heroImageSrc ?? CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="min-h-[min(696px,90vh)] max-h-[90vh] bg-canvas-sheet"
        data-testid="contacts-feature-introduction-dialog"
      >
        <DialogHeader density="expanded" onClose={onClose} />
        <DialogBody className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ContactsFeatureIntroductionDialogContent
            title={title}
            highlights={highlights}
            heroImage={heroImage}
          />
        </DialogBody>
        <DialogFooter>
          <Button
            appearance="base"
            size="lg"
            isFull
            onClick={complete}
            data-testid="contacts-feature-introduction-primary"
          >
            {primaryActionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
