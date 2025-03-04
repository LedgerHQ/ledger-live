import { t } from "i18next";
import { Trans } from "react-i18next";
import React from "react";
import { BannerCard, Button, Icons, Link, NotificationCard, Text } from "@ledgerhq/react-ui";
import type { FlexBoxProps } from "@ledgerhq/react-ui/components/layout/Flex/index";
import { useLNSUpsellBannerModel } from "../../hooks/useLNSUpsellBannerModel";
import type { LNSBannerLocation } from "../../types";

type Props = FlexBoxProps & { location: LNSBannerLocation };

export function LNSUpsellBanner({ location, ...boxProps }: Props) {
  const { variant, discount, image, tracking, handleCTAClick } = useLNSUpsellBannerModel(location);

  switch (variant) {
    case "none":
      return null;

    case "banner":
      return (
        <BannerCard
          {...boxProps}
          title={t(`lnsUpsell.banner.${location}.${tracking}.title`)}
          description={
            <Trans
              i18nKey={`lnsUpsell.banner.${location}.${tracking}.description`}
              values={{ discount }}
            >
              <Text color="primary.c80" />
            </Trans>
          }
          image={image}
          cta={
            <Button variant="main" outline={false}>
              {t(`lnsUpsell.banner.${location}.${tracking}.cta`)}
            </Button>
          }
          maxHeight={175}
          borderRadius="5px"
          onClick={handleCTAClick}
        />
      );

    case "notification":
      return (
        <NotificationCard
          {...boxProps}
          description={t(`lnsUpsell.banner.${location}.${tracking}.description`, { discount })}
          cta={
            <Link alignSelf="start" color="primary.c80" size="small">
              {t(`lnsUpsell.banner.${location}.${tracking}.cta`)}
              <Icons.ExternalLink size="S" style={{ marginLeft: "8px", verticalAlign: "middle" }} />
            </Link>
          }
          icon="SparksFill"
          onClick={handleCTAClick}
          isHighlighted
        />
      );
  }
}
