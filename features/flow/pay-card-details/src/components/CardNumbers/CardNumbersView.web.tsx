import React from "react";
import { cn } from "@ledgerhq/lumen-utils-shared";
import { useTranslation } from "@shared/i18n";
import { CARD_GRADIENT } from "../CardArtwork/cardGradient";
import type { CardNumbersViewProps } from "../../types";

export function CardNumbersView({
  status,
  imageUrl,
  onImageError,
  cardFace,
}: CardNumbersViewProps) {
  const isRevealed = status === "revealed" && Boolean(imageUrl);
  const details = imageUrl ? (
    <DetailsImage imageUrl={imageUrl} onImageError={onImageError} />
  ) : null;

  if (cardFace) {
    return (
      <div data-testid="card-numbers">
        <FlipCard isRevealed={isRevealed} cardFace={cardFace}>
          {details}
        </FlipCard>
      </div>
    );
  }

  return <div data-testid="card-numbers">{isRevealed ? details : null}</div>;
}

function FlipCard({
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
        data-testid="card-numbers-flip"
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
      className="flex size-full h-[195px] w-full items-center overflow-hidden rounded-lg border border-muted-subtle pl-4 pr-16"
      style={{ backgroundImage: CARD_GRADIENT }}
    >
      <img
        src={imageUrl}
        alt={t("payTab.card.numbers.imageAlt")}
        referrerPolicy="no-referrer"
        className="max-h-full max-w-full object-contain object-left"
        onError={onImageError}
      />
    </div>
  );
}
