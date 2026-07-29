import React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import type { ContactsFeatureIntroduction } from "../types";
import { useSingleFireDismiss } from "../internals/useSingleFireDismiss";
import { CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE } from "./assets";
import { ContactsFeatureIntroductionDialogContent } from "./ContactsFeatureIntroductionDialogContent.web";

export function ContactsFeatureIntroductionDialog({
  isOpen,
  title,
  description,
  highlights,
  primaryActionLabel,
  secondaryActionLabel,
  heroImageSrc,
  onComplete,
  onDefer,
}: ContactsFeatureIntroduction): React.ReactNode {
  const complete = useSingleFireDismiss(onComplete, isOpen);
  const defer = useSingleFireDismiss(onDefer, isOpen);
  const heroImage = heroImageSrc ?? CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      defer();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] w-[480px] bg-canvas-sheet p-0"
        data-testid="contacts-feature-introduction-dialog"
      >
        <DialogHeader density="expanded" onClose={defer} />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-24 overflow-hidden px-24 pb-24">
          <ContactsFeatureIntroductionDialogContent
            title={title}
            description={description}
            highlights={highlights}
            heroImage={heroImage}
          />
          <div className="flex w-full shrink-0 flex-col items-center gap-16">
            <Button
              appearance="base"
              size="lg"
              onClick={complete}
              className="w-full"
              data-testid="contacts-feature-introduction-primary"
            >
              {primaryActionLabel}
            </Button>
            <Button
              appearance="gray"
              size="lg"
              onClick={defer}
              className="w-full"
              data-testid="contacts-feature-introduction-secondary"
            >
              {secondaryActionLabel}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
