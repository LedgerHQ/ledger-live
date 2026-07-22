import React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import * as Icons from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactsFeatureIntroduction } from "../../types";
import { useSingleFireDismiss } from "../internals/useSingleFireDismiss";

const FEATURE_INTRO_HERO_IMAGE_CLASSNAME =
  "pointer-events-none h-[200px] w-full select-none rounded-xl border border-solid border-icon object-cover";
const FEATURE_INTRO_HERO_PLACEHOLDER_CLASSNAME =
  "h-[200px] shrink-0 rounded-xl border border-solid border-icon bg-muted";

export function ContactsFeatureIntroductionDialog({
  isOpen,
  title,
  description,
  highlights,
  primaryActionLabel,
  secondaryActionLabel,
  heroImageSrc,
  onDismiss,
}: ContactsFeatureIntroduction): React.ReactNode {
  const dismiss = useSingleFireDismiss(onDismiss, isOpen);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      dismiss();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] w-[480px] bg-base p-0"
        data-testid="contacts-feature-introduction-dialog"
      >
        <DialogHeader density="expanded" onClose={dismiss} />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-24 overflow-hidden px-24 pb-24">
          <div className="scrollbar-none flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto">
            {heroImageSrc ? (
              <img
                src={heroImageSrc}
                alt=""
                className={FEATURE_INTRO_HERO_IMAGE_CLASSNAME}
                draggable={false}
                decoding="async"
              />
            ) : (
              <div className={FEATURE_INTRO_HERO_PLACEHOLDER_CLASSNAME} aria-hidden />
            )}
            <div className="flex w-full min-w-0 flex-col gap-8">
              <h2 className="heading-2-semi-bold text-base">{title}</h2>
              <p className="body-2 text-muted">{description}</p>
            </div>
            {highlights.map(highlight => {
              const HighlightIcon = Icons[highlight.icon];

              return (
                <div key={highlight.icon} className="flex gap-16">
                  <HighlightIcon size={24} className="shrink-0" />
                  <div className="flex min-w-0 flex-col gap-4">
                    <p className="body-1-semi-bold text-base">{highlight.title}</p>
                    <p className="body-2 text-muted">{highlight.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex w-full shrink-0 flex-col items-center gap-16">
            <Button
              appearance="base"
              size="lg"
              onClick={dismiss}
              className="w-full"
              data-testid="contacts-feature-introduction-primary"
            >
              {primaryActionLabel}
            </Button>
            <Button
              appearance="gray"
              size="lg"
              onClick={dismiss}
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
