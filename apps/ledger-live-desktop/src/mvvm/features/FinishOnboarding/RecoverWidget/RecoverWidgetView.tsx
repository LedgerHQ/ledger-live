import React, { memo, useMemo } from "react";
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
import useTheme from "~/renderer/hooks/useTheme";

const RecoverWidgetView = memo(function RecoverWidgetView({
  shouldDisplay,
  titleKey,
  descriptionKey,
  onOpenRecover,
}: RecoverWidgetViewProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const warningSpotStyle = useMemo(
    () => ({
      backgroundColor: colors.warning.c10,
      color: colors.warning.c70,
    }),
    [colors],
  );

  if (!shouldDisplay) {
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
        <Spot appearance="icon" icon={ShieldCheck} size={48} style={warningSpotStyle} />
        <ContentBannerContent>
          <ContentBannerTitle>{t(titleKey)}</ContentBannerTitle>
          <ContentBannerDescription>{t(descriptionKey)}</ContentBannerDescription>
        </ContentBannerContent>
      </ContentBanner>
    </button>
  );
});

export default RecoverWidgetView;
