import React from "react";
import { cn } from "@ledgerhq/lumen-utils-shared";
import { useTranslation } from "@shared/i18n";
import { CARD_GRADIENT } from "../CardArtwork/cardGradient.web";
import type { CardFlipViewProps } from "../../types";

export function CardFlipView({
  isRevealed,
  imageUrl,
  onImageError,
  cardFace,
}: CardFlipViewProps) {
  const details = imageUrl ? (
    <DetailsImage imageUrl={imageUrl} onImageError={onImageError} />
  ) : null;

  if (cardFace) {
    return (
      <div data-testid="card-flip">
        <FlipFaces isRevealed={isRevealed} cardFace={cardFace}>
          {details}
        </FlipFaces>
      </div>
    );
  }

  return <div data-testid="card-flip">{isRevealed ? details : null}</div>;
}

function FlipFaces({
  isRevealed,
  cardFace,
  children,
}: {
  readonly isRevealed: boolean;
  readonly cardFace: React.ReactNode;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="[perspective:1000px]">
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
          {children}
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
