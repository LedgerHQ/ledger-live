import React, { useCallback, useEffect } from "react";
import { GestureResponderEvent } from "react-native";
import {
  ContentBanner,
  ContentBannerContent,
  ContentBannerDescription,
  ContentBannerTitle,
  Pressable,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Settings } from "@ledgerhq/lumen-ui-rnative/symbols";
import { ContentCardBuilder } from "~/contentCards/cards/utils";
import type { ContentCardProps } from "~/contentCards/cards/types";

const ContentBannerActionCard = ContentCardBuilder<ContentCardProps>(props => {
  const { title, metadata } = props;
  const description = "description" in props ? props.description : undefined;

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

  return (
    <Pressable onPress={metadata.actions?.onClick} key={metadata.id}>
      <ContentBanner onClose={handleDismiss}>
        <Spot appearance="icon" icon={Settings} size={48} />
        <ContentBannerContent>
          <ContentBannerTitle>{title ?? ""}</ContentBannerTitle>
          {description ? <ContentBannerDescription>{description}</ContentBannerDescription> : null}
        </ContentBannerContent>
      </ContentBanner>
    </Pressable>
  );
});

export { ContentBannerActionCard };
