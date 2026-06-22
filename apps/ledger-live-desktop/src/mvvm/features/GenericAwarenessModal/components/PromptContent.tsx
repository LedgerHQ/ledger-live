import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { hasAwarenessModalActionButton } from "@ledgerhq/live-common/genericAwarenessModal";
import { useThemedAwarenessModalImage } from "../hooks/useThemedAwarenessModalImage";
import { AwarenessModalClampedText, PROMPT_TEXT_LINE_LIMITS } from "./clampedText";

export type PromptContentProps = {
  title: string;
  subtitle: string;
  primaryButtonLabel: string;
  primaryButtonLink: string;
  secondaryButtonLabel: string;
  secondaryButtonLink: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  imageUrlLight?: string;
  imageUrlDark?: string;
};

export default function PromptContent({
  title,
  subtitle,
  imageUrlLight,
  imageUrlDark,
  primaryButtonLabel,
  primaryButtonLink,
  secondaryButtonLabel,
  secondaryButtonLink,
  onPrimaryClick,
  onSecondaryClick,
}: Readonly<PromptContentProps>) {
  const showPrimaryButton = hasAwarenessModalActionButton(primaryButtonLabel, primaryButtonLink);
  const showSecondaryButton = hasAwarenessModalActionButton(
    secondaryButtonLabel,
    secondaryButtonLink,
  );
  const { imageUrl, showImage } = useThemedAwarenessModalImage(
    imageUrlLight != null || imageUrlDark != null
      ? { imageUrlLight: imageUrlLight ?? "", imageUrlDark: imageUrlDark ?? "" }
      : undefined,
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto">
        {showImage ? (
          <img
            src={imageUrl}
            alt=""
            className="pointer-events-none h-[200px] w-full select-none rounded-xl object-cover"
            draggable={false}
            decoding="async"
          />
        ) : (
          <div className="h-[200px] shrink-0 rounded-xl bg-muted" aria-hidden />
        )}
        <div className="flex w-full min-w-0 flex-col items-center text-center">
          <AwarenessModalClampedText
            text={title}
            maxLines={PROMPT_TEXT_LINE_LIMITS.title}
            className="mb-8 text-center heading-4-semi-bold text-base"
          />
          <AwarenessModalClampedText
            text={subtitle}
            maxLines={PROMPT_TEXT_LINE_LIMITS.subtitle}
            className="body-2 text-center text-muted"
          />
        </div>
      </div>
      <div className="flex w-full shrink-0 flex-col items-center gap-16 pt-24">
        {showPrimaryButton ? (
          <Button
            appearance="base"
            size="lg"
            onClick={onPrimaryClick}
            className="w-full"
            data-testid="generic-awareness-modal-primary-button"
          >
            {primaryButtonLabel}
          </Button>
        ) : null}
        {showSecondaryButton ? (
          <Button
            appearance="gray"
            size="lg"
            onClick={onSecondaryClick}
            className="w-full"
            data-testid="generic-awareness-modal-secondary-button"
          >
            {secondaryButtonLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
