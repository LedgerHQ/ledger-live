import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { TruncatedText } from "LLD/components/TruncatedText";

export type PromptContentProps = {
  title: string;
  subtitle: string;
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  imageUrl?: string;
};

export default function PromptContent({
  title,
  subtitle,
  imageUrl,
  primaryButtonLabel,
  secondaryButtonLabel,
  onPrimaryClick,
  onSecondaryClick,
}: Readonly<PromptContentProps>) {
  const showImage = imageUrl != null && imageUrl.length > 0;

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
          <TruncatedText text={title} className="mb-8 text-center heading-4-semi-bold text-base" />
          <p className="m-0 body-2 text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="flex w-full shrink-0 flex-col items-center gap-16 pt-24">
        <Button
          appearance="base"
          size="lg"
          onClick={onPrimaryClick}
          className="w-full"
          data-testid="generic-awareness-modal-primary-button"
        >
          {primaryButtonLabel}
        </Button>
        <Button
          appearance="gray"
          size="lg"
          onClick={onSecondaryClick}
          className="w-full"
          data-testid="generic-awareness-modal-secondary-button"
        >
          {secondaryButtonLabel}
        </Button>
      </div>
    </div>
  );
}
