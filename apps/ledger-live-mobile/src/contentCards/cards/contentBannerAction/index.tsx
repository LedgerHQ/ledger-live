import React, { useCallback, useEffect } from "react";
import {
  Box,
  ContentBanner,
  ContentBannerContent,
  ContentBannerDescription,
  ContentBannerTitle,
  InteractiveIcon,
  MediaBanner,
  MediaBannerDescription,
  MediaBannerTitle,
  Pressable,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import * as Icons from "@ledgerhq/lumen-ui-rnative/symbols";
import { ContentCardBuilder } from "~/contentCards/cards/utils";
import type { ContentCardProps } from "~/contentCards/cards/types";

const CONTENT_BANNER_CLOSE_LABEL = "Close content banner";

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

  const handleDismiss = useCallback(() => {
    metadata.actions?.onDismiss?.();
  }, [metadata.actions]);

  if (imageBackground && imageBackground.length > 0) {
    return (
      <MediaBanner
        key={metadata.id}
        imageUrl={imageBackground}
        onClose={metadata.actions?.onDismiss ? handleDismiss : undefined}
        onPress={metadata.actions?.onClick}
      >
        {title ? <MediaBannerTitle>{title}</MediaBannerTitle> : null}
        {description ? <MediaBannerDescription>{description}</MediaBannerDescription> : null}
      </MediaBanner>
    );
  }

  return (
    <Box key={metadata.id} lx={{ position: "relative", width: "full" }}>
      <Pressable onPress={metadata.actions?.onClick}>
        <ContentBanner>
          <Spot appearance="icon" icon={icon} size={48} />
          <ContentBannerContent>
            <ContentBannerTitle>{title ?? ""}</ContentBannerTitle>
            {description ? (
              <ContentBannerDescription>{description}</ContentBannerDescription>
            ) : null}
          </ContentBannerContent>
        </ContentBanner>
      </Pressable>
      {metadata.actions?.onDismiss ? (
        <Box lx={{ position: "absolute", top: "s8", right: "s8", zIndex: 1 }}>
          <InteractiveIcon
            testID="content-banner-close-button"
            iconType="stroked"
            icon={Close}
            size={16}
            onPress={handleDismiss}
            accessibilityLabel={CONTENT_BANNER_CLOSE_LABEL}
          />
        </Box>
      ) : null}
    </Box>
  );
});

export { ContentBannerActionCard };
