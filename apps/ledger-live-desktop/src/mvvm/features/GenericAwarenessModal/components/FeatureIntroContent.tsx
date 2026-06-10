import React from "react";
import { hasAwarenessModalActionButton } from "@ledgerhq/live-common/genericAwarenessModal";
import {
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import * as Icons from "@ledgerhq/lumen-ui-react/symbols";
import { useThemedAwarenessModalImage } from "../hooks/useThemedAwarenessModalImage";
import { AwarenessModalClampedText, FEATURE_INTRO_TEXT_LINE_LIMITS } from "./clampedText";

export type LumenSymbolName = keyof typeof Icons;

export type FeatureIntroContentItem = {
  title: string;
  subtitle: string;
  icon: LumenSymbolName;
};

const FEATURE_INTRO_HERO_IMAGE_CLASSNAME =
  "pointer-events-none h-[200px] w-full select-none rounded-xl border border-solid border-icon object-cover";
const FEATURE_INTRO_HERO_PLACEHOLDER_CLASSNAME =
  "h-[200px] shrink-0 rounded-xl border border-solid border-icon bg-muted";

type FeatureIntroContentProps = {
  title: string;
  subtitle: string;
  items: FeatureIntroContentItem[];
  primaryButtonLabel: string;
  primaryButtonLink: string;
  secondaryButtonLabel: string;
  secondaryButtonLink: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
  imageUrlLight?: string;
  imageUrlDark?: string;
};

export default function FeatureIntroContent({
  title,
  subtitle,
  imageUrlLight,
  imageUrlDark,
  items,
  primaryButtonLabel,
  primaryButtonLink,
  secondaryButtonLabel,
  secondaryButtonLink,
  onPrimaryClick,
  onSecondaryClick,
}: Readonly<FeatureIntroContentProps>) {
  const showPrimaryButton = hasAwarenessModalActionButton(
    primaryButtonLabel,
    primaryButtonLink,
  );
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
      <div className="scrollbar-none flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto">
        {showImage ? (
          <img
            src={imageUrl}
            alt=""
            className={FEATURE_INTRO_HERO_IMAGE_CLASSNAME}
            draggable={false}
            decoding="async"
          />
        ) : (
          <div className={FEATURE_INTRO_HERO_PLACEHOLDER_CLASSNAME} aria-hidden />
        )}
        <div className="relative right-auto flex w-full min-w-0 flex-col gap-[unset]">
          <AwarenessModalClampedText
            text={title}
            maxLines={FEATURE_INTRO_TEXT_LINE_LIMITS.title}
            className="heading-2-semi-bold text-base"
          />
          <AwarenessModalClampedText
            text={subtitle}
            maxLines={FEATURE_INTRO_TEXT_LINE_LIMITS.subtitle}
            className="mb-12 body-2 text-muted"
          />
          {items.map((item, index) => {
            const ItemIcon = Icons[item.icon];
            return (
              <ListItem
                key={`${item.title}-list-item-${index}`}
                className="pointer-events-none px-0"
              >
                <ListItemLeading className="p-0">
                  <ItemIcon size={24} />
                  <ListItemContent>
                    <ListItemTitle className="min-w-0 overflow-visible whitespace-normal">
                      <AwarenessModalClampedText
                        text={item.title}
                        maxLines={FEATURE_INTRO_TEXT_LINE_LIMITS.itemTitle}
                      />
                    </ListItemTitle>
                    <ListItemDescription className="min-w-0 overflow-visible whitespace-normal">
                      <AwarenessModalClampedText
                        text={item.subtitle}
                        maxLines={FEATURE_INTRO_TEXT_LINE_LIMITS.itemSubtitle}
                      />
                    </ListItemDescription>
                  </ListItemContent>
                </ListItemLeading>
              </ListItem>
            );
          })}
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
