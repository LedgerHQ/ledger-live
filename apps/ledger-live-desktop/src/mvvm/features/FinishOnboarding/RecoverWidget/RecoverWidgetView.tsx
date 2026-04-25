import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  ContentBanner,
  ContentBannerContent,
  ContentBannerDescription,
  ContentBannerTitle,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import type { RecoverWidgetViewProps } from "./useRecoverWidgetViewModel";
import { ShieldCheck } from "@ledgerhq/lumen-ui-react/symbols";

// TODO: I did not find a way to change the Spot appearance color
const WARNING_SPOT_STYLE = {
  backgroundColor: "#FFBD4226",
  color: "#FFD373",
} as const;

const RecoverWidgetView = memo(function RecoverWidgetView({
  isVisible,
  titleKey,
  descriptionKey,
  onOpenRecover,
}: RecoverWidgetViewProps) {
  const { t } = useTranslation();

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      data-testid="recover-finish-onboarding-widget"
      onClick={onOpenRecover}
      className="min-w-0 w-1/2 cursor-pointer border-none bg-transparent p-0 text-left"
    >
      <ContentBanner>
        <Spot appearance="icon" icon={ShieldCheck} size={48} style={WARNING_SPOT_STYLE} />
        <ContentBannerContent>
          <ContentBannerTitle>{t(titleKey)}</ContentBannerTitle>
          <ContentBannerDescription>{t(descriptionKey)}</ContentBannerDescription>
        </ContentBannerContent>
      </ContentBanner>
    </button>
  );
});

export default RecoverWidgetView;
