import React, { memo, type ComponentProps } from "react";
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

type PaddingHorizontal = NonNullable<ComponentProps<typeof Pressable>["lx"]>["paddingHorizontal"];

function View({
  title,
  description,
  onRedirectRecover,
  onCloseBanner,
  shouldDisplay,
  paddingHorizontal = "s16",
}: ReturnType<typeof useRecoverBannerViewModel> & { paddingHorizontal?: PaddingHorizontal }) {
  if (!shouldDisplay) return null;

  return (
    <Pressable onPress={onRedirectRecover} lx={{ paddingHorizontal }}>
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

function RecoverBanner({ paddingHorizontal }: { paddingHorizontal?: PaddingHorizontal }) {
  return <View {...useRecoverBannerViewModel()} paddingHorizontal={paddingHorizontal} />;
}

export default memo(RecoverBanner);
