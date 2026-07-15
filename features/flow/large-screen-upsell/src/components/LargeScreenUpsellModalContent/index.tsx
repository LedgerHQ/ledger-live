import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { LargeScreenUpsellModalViewModel } from "../../screens/LargeScreenUpsellModal/types";

type LargeScreenUpsellModalContentProps = Pick<
  LargeScreenUpsellModalViewModel,
  "imageSrc" | "title" | "subtitle" | "primaryButtonLabel" | "onCtaPress"
>;

export function LargeScreenUpsellModalContent({
  imageSrc,
  title,
  subtitle,
  primaryButtonLabel,
  onCtaPress,
}: LargeScreenUpsellModalContentProps) {
  const showPrimaryButton = primaryButtonLabel.trim().length > 0;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            className="pointer-events-none h-[200px] w-full select-none rounded-xl object-cover"
            draggable={false}
            decoding="async"
            data-testid="large-screen-upsell-modal-hero"
          />
        ) : (
          <div className="h-[200px] shrink-0 rounded-xl bg-muted" aria-hidden />
        )}
        <div className="flex w-full min-w-0 flex-col items-center text-center">
          <p className="mb-8 line-clamp-2 text-center heading-4-semi-bold text-base">{title}</p>
          <p className="line-clamp-3 body-2 text-center text-muted">{subtitle}</p>
        </div>
      </div>
      {showPrimaryButton ? (
        <div className="flex w-full shrink-0 flex-col items-center pt-24">
          <Button
            appearance="base"
            size="lg"
            onClick={onCtaPress}
            className="w-full"
            data-testid="large-screen-upsell-modal-primary-button"
          >
            {primaryButtonLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
