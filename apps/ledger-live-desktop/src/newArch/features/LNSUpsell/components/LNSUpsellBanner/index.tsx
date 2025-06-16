import { t } from "i18next";
import { Trans } from "react-i18next";
import React, { type ReactElement } from "react";
import { BannerCard, Button, Icons, Link, NotificationCard, Text } from "@ledgerhq/react-ui";
import type { FlexBoxProps } from "@ledgerhq/react-ui/components/layout/Flex/index";
import type { LNSBannerLocation } from "LLD/features/LNSUpsell/types";
import { useLNSUpsellBannerModel } from "./useLNSUpsellBannerModel";
import { useViewNotification } from "./useViewNotification";
import type { LNSBannerModel } from "./types";

type Props = FlexBoxProps & { location: LNSBannerLocation };

export function LNSUpsellBanner({ location, ...boxProps }: Props) {
  return <View {...useLNSUpsellBannerModel(location)} location={location} {...boxProps} />;
}

function View({
  location,
  variant,
  discount,
  tracking,
  handleCTAClick,
  ...boxProps
}: Props & LNSBannerModel): ReactElement | null {
  useViewNotification(location, variant);

  switch (variant.type) {
    case "none":
      return null;

    case "banner":
      return (
        <BannerCard
          {...boxProps}
          title={t(`lnsUpsell.${tracking}.title`)}
          description={
            <Trans i18nKey={`lnsUpsell.${tracking}.description`} values={{ discount }}>
              <Text color="primary.c80" />
            </Trans>
          }
          cta={
            <Button variant="main" outline={false}>
              {t(`lnsUpsell.${tracking}.cta`)}
            </Button>
          }
          image={variant.image}
          borderRadius="5px"
          onClick={handleCTAClick}
        />
      );

    case "notification":
      return (
        <NotificationCard
          {...boxProps}
          description={
            <Trans i18nKey={`lnsUpsell.${tracking}.description`} values={{ discount }}>
              <span />
            </Trans>
          }
          cta={
            <Link alignSelf="start" color="primary.c80" size="small">
              {t(`lnsUpsell.${tracking}.cta`)}
              <Icons.ExternalLink size="S" style={{ marginLeft: "8px", verticalAlign: "middle" }} />
            </Link>
          }
          icon={variant.icon}
          onClick={handleCTAClick}
          isHighlighted
        />
      );
  }
}
