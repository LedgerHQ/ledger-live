import React, { memo } from "react";
import useRecoverBannerViewModel from "./useRecoverBannerViewModel";
import { ShieldLock } from "@ledgerhq/lumen-ui-rnative/symbols";
import {
  ContentBanner,
  ContentBannerContent,
  ContentBannerTitle,
  ContentBannerDescription,
  Spot,
  Pressable,
} from "@ledgerhq/lumen-ui-rnative";

function View({
  title,
  description,
  onRedirectRecover,
  onCloseBanner,
  shouldDisplay,
}: ReturnType<typeof useRecoverBannerViewModel>) {
  if (!shouldDisplay) return null;

  return (
    <Pressable onPress={onRedirectRecover} lx={{ paddingHorizontal: "s16" }}>
      <ContentBanner onClose={onCloseBanner}>
        <Spot appearance="icon" icon={ShieldLock} lx={{ backgroundColor: "warning" }} />
        <ContentBannerContent>
          <ContentBannerTitle>{title}</ContentBannerTitle>
          <ContentBannerDescription>{description}</ContentBannerDescription>
        </ContentBannerContent>
      </ContentBanner>
    </Pressable>
  );
}

function RecoverBanner() {
  return <View {...useRecoverBannerViewModel()} />;
}

export default memo(RecoverBanner);
