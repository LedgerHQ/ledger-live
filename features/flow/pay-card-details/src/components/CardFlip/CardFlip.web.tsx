import React from "react";
import { cn } from "@ledgerhq/lumen-utils-shared";
import { useTranslation } from "@shared/i18n";
import { CARD_GRADIENT } from "../CardArtwork/cardGradient.web";
import type { CardFlipProps } from "../../types";

export function CardFlip({ reveal, cardFace }: CardFlipProps) {
  if (!reveal) {
    return <>{cardFace}</>;
  }

  const { isRevealed, imageUrl, onImageError } = reveal;
  const details = imageUrl ? (
    <DetailsImage imageUrl={imageUrl} onImageError={onImageError} />
  ) : null;

  return (
    <div data-testid="card-flip" className="[perspective:1000px]">
      <div
        className={cn(
          "relative h-[195px] w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none",
          isRevealed ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]",
        )}
      >
        <div className="absolute inset-0 [backface-visibility:hidden]" aria-hidden={isRevealed}>
          {cardFace}
        </div>
        <div
          className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          aria-hidden={!isRevealed}
        >
          {details}
        </div>
      </div>
    </div>
  );
}

function DetailsImage({
  imageUrl,
  onImageError,
}: {
  readonly imageUrl: string;
  readonly onImageError: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="size-full h-[195px] w-full overflow-hidden rounded-lg border border-muted-subtle"
      style={{ backgroundImage: CARD_GRADIENT }}
    >
      <img
        src={imageUrl}
        alt={t("payTab.card.numbers.imageAlt")}
        width={343}
        height={193}
        referrerPolicy="no-referrer"
        decoding="async"
        className="size-full object-cover"
        onError={onImageError}
      />
    </div>
  );
}
