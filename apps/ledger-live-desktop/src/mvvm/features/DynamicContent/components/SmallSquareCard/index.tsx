import React, { memo } from "react";
import { InteractiveIcon, Tag } from "@ledgerhq/lumen-ui-react";
import * as Icons from "@ledgerhq/lumen-ui-react/symbols";

import type { SmallSquareCardProps } from "./types";

export default memo(SmallSquareCard);

const CARD_HEIGHT_PX = 148;
const MEDIA_SIZE_PX = 72;
const MEDIA_TOP_PADDING_PX = 16;
const TEXT_TOP_PADDING_PX = 12;
const TITLE_LINE_HEIGHT_PX = 20;
const PRICE_LINE_HEIGHT_PX = 16;
const TITLE_PRICE_GAP_PX = 4;
const CARD_BOTTOM_PADDING_PX = 8;
const IMAGE_MEDIA_TYPES = new Set<SmallSquareCardProps["mediaType"]>(["image", "gif"]);
const DEFAULT_CLICKABLE_CARD_LABEL = "Content card";

function getClickableCardLabel(title?: string, tag?: string, subDescription?: string): string {
  return title?.trim() || tag?.trim() || subDescription?.trim() || DEFAULT_CLICKABLE_CARD_LABEL;
}

type CardOverlayProps = Readonly<Pick<SmallSquareCardProps, "tag" | "isDismissable" | "onDismiss">>;

function CardOverlay({ tag, isDismissable, onDismiss }: CardOverlayProps) {
  const showClose = Boolean(isDismissable && onDismiss);
  if (!tag && !showClose) return null;

  const handleClose = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDismiss?.();
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] flex items-start gap-8 p-12">
      {tag ? (
        <div className="min-w-0 shrink">
          <Tag label={tag} size="sm" />
        </div>
      ) : null}
      {showClose ? (
        <InteractiveIcon
          type="button"
          iconType="stroked"
          icon={Icons.Close}
          size={16}
          aria-label="Dismiss"
          data-testid="small-square-card-close"
          onClick={handleClose}
          className="pointer-events-auto ml-auto shrink-0 text-muted"
        />
      ) : null}
    </div>
  );
}

type CardContainerProps = Readonly<{
  children: React.ReactNode;
  isMediaOnly: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}>;

const INTERACTIVE_CLASSES =
  "cursor-pointer group-hover/card:bg-surface-hover active:bg-surface-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function CardContainer({ children, isMediaOnly, onClick, ariaLabel }: CardContainerProps) {
  const className = `flex w-full flex-col overflow-hidden rounded-lg border-0 bg-surface p-0 transition-colors ${
    isMediaOnly ? "items-center justify-center" : ""
  } ${onClick ? INTERACTIVE_CLASSES : "cursor-default"}`;
  const style = { height: CARD_HEIGHT_PX };

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        aria-label={ariaLabel}
        onClick={onClick}
        data-testid="small-square-card"
        style={style}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={className} data-testid="small-square-card" style={style}>
      {children}
    </div>
  );
}

type CardMediaProps = Readonly<
  Pick<SmallSquareCardProps, "title" | "media" | "mediaType" | "filledMedia">
>;

function CardMedia({ title, media, mediaType, filledMedia }: CardMediaProps) {
  const showImage = media && IMAGE_MEDIA_TYPES.has(mediaType);

  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{
        height: MEDIA_TOP_PADDING_PX + MEDIA_SIZE_PX,
        paddingTop: MEDIA_TOP_PADDING_PX,
      }}
    >
      {showImage ? (
        <img
          src={media}
          alt={title ?? ""}
          draggable={false}
          className={`block shrink-0 ${filledMedia ? "object-cover" : "object-contain"}`}
          style={{ width: MEDIA_SIZE_PX, height: MEDIA_SIZE_PX }}
        />
      ) : null}
    </div>
  );
}

type CardTextProps = Readonly<Pick<SmallSquareCardProps, "title" | "subDescription">>;

function CardText({ title, subDescription }: CardTextProps) {
  const hasSubDescription = Boolean(subDescription);

  return (
    <div
      className="flex w-full shrink-0 flex-col items-center px-16"
      style={{
        paddingTop: TEXT_TOP_PADDING_PX,
        paddingBottom: CARD_BOTTOM_PADDING_PX,
      }}
    >
      <span
        className={`flex w-full items-center justify-center truncate text-center body-2 text-base ${
          title ? "visible" : "invisible"
        }`}
        style={{ height: TITLE_LINE_HEIGHT_PX }}
      >
        {title}
      </span>
      <span
        className={`flex w-full items-center justify-center truncate text-center body-3 text-muted ${
          hasSubDescription ? "visible" : "invisible"
        }`}
        style={{
          marginTop: TITLE_PRICE_GAP_PX,
          height: PRICE_LINE_HEIGHT_PX,
        }}
      >
        {subDescription}
      </span>
    </div>
  );
}

function SmallSquareCard({
  title,
  subDescription,
  tag,
  media,
  mediaType = "image",
  filledMedia = false,
  isDismissable,
  onClick,
  onDismiss,
}: SmallSquareCardProps) {
  const hasSubDescription = Boolean(subDescription);
  const isMediaOnly = !title && !hasSubDescription && !tag;
  const showTextContent = !isMediaOnly && (title || hasSubDescription);

  if (![media, title, subDescription, tag].some(Boolean)) return null;

  const clickableCardLabel = onClick
    ? getClickableCardLabel(title, tag, subDescription)
    : undefined;

  return (
    <div className="group/card relative w-full min-w-0">
      <CardOverlay tag={tag} isDismissable={isDismissable} onDismiss={onDismiss} />
      <CardContainer isMediaOnly={isMediaOnly} onClick={onClick} ariaLabel={clickableCardLabel}>
        <CardMedia title={title} media={media} mediaType={mediaType} filledMedia={filledMedia} />
        {showTextContent ? <CardText title={title} subDescription={subDescription} /> : null}
      </CardContainer>
    </div>
  );
}
