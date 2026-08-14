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
  const isImageMedia = mediaType === "image" || mediaType === "gif";
  const showTextContent = !isMediaOnly && (title || hasSubDescription);

  if (!media && !title && !hasSubDescription && !tag) {
    return null;
  }

  const handleClose = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDismiss?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  const showClose = Boolean(isDismissable && onDismiss);

  return (
    <div className="relative w-full min-w-0">
      {tag || showClose ? (
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
      ) : null}
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`flex w-full flex-col overflow-hidden rounded-lg bg-surface ${
          isMediaOnly ? "items-center justify-center" : ""
        } ${onClick ? "cursor-pointer" : "cursor-default"}`}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        data-testid="small-square-card"
        style={{ height: CARD_HEIGHT_PX }}
      >
        <div
          className="flex shrink-0 items-center justify-center"
          style={{
            height: MEDIA_TOP_PADDING_PX + MEDIA_SIZE_PX,
            paddingTop: MEDIA_TOP_PADDING_PX,
          }}
        >
          {media && isImageMedia ? (
            <img
              src={media}
              alt={title ?? ""}
              draggable={false}
              className={`block shrink-0 ${filledMedia ? "object-cover" : "object-contain"}`}
              style={{ width: MEDIA_SIZE_PX, height: MEDIA_SIZE_PX }}
            />
          ) : null}
        </div>
        {showTextContent ? (
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
        ) : null}
      </div>
    </div>
  );
}
