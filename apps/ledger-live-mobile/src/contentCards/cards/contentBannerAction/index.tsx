import React, { useCallback, useEffect } from "react";
import { GestureResponderEvent } from "react-native";
import {
  ContentBanner,
  ContentBannerContent,
  ContentBannerDescription,
  ContentBannerTitle,
  MediaBanner,
  MediaBannerDescription,
  MediaBannerTitle,
  Pressable,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import * as Icons from "@ledgerhq/lumen-ui-rnative/symbols";
import { ContentCardBuilder } from "~/contentCards/cards/utils";
import type { ContentCardProps } from "~/contentCards/cards/types";

const ContentBannerActionCard = ContentCardBuilder<ContentCardProps>(props => {
  const { title, metadata } = props;
  const description = "description" in props ? props.description : undefined;

  const imageBackground =
    "image_background" in props && props.image_background?.length
      ? props.image_background
      : undefined;
  const iconProp =
    "icon" in props && props.icon !== undefined ? (props.icon as keyof typeof Icons) : "Settings";
  const icon = Icons[iconProp] || Icons.Settings;

  useEffect(() => metadata.actions?.onView?.());

  const handleDismiss = useCallback(
    (event?: GestureResponderEvent) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      metadata.actions?.onDismiss?.();
    },
    [metadata.actions],
  );

  if (imageBackground && imageBackground.length > 0) {
    return (
      <MediaBanner
        key={metadata.id}
        imageUrl={imageBackground}
        onClose={handleDismiss}
        onPress={metadata.actions?.onClick}
      >
        {title ? <MediaBannerTitle>{title}</MediaBannerTitle> : null}
        {description ? <MediaBannerDescription>{description}</MediaBannerDescription> : null}
      </MediaBanner>
    );
  }

  return (
    <Pressable onPress={metadata.actions?.onClick} key={metadata.id}>
      <ContentBanner onClose={handleDismiss}>
        <Spot appearance="icon" icon={icon} size={48} />
        <ContentBannerContent>
          <ContentBannerTitle>{title ?? ""}</ContentBannerTitle>
          {description ? <ContentBannerDescription>{description}</ContentBannerDescription> : null}
        </ContentBannerContent>
      </ContentBanner>
    </Pressable>
  );
});

export { ContentBannerActionCard };
