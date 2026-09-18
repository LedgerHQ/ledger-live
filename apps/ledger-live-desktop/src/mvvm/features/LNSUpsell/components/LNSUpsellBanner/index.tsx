import { t } from "~/renderer/i18n/init";
import { Trans } from "react-i18next";
import React, { type ReactElement } from "react";
import { BannerCard, Button, Flex, Icons, Link, NotificationCard, Text } from "@ledgerhq/react-ui";
import type { FlexBoxProps } from "@ledgerhq/react-ui/components/layout/Flex/index";
import type { LNSBannerLocation } from "LLD/features/LNSUpsell/types";
import { useLNSUpsellBannerModel } from "./useLNSUpsellBannerModel";
import { LNSUpsellMediaBanner } from "./LNSUpsellMediaBanner";
import { useViewNotification } from "./useViewNotification";
import type { LNSBannerModel } from "./types";

type Props = FlexBoxProps & { location: LNSBannerLocation };

const FULL_WIDTH_BANNER_LOCATIONS = new Set<LNSBannerLocation>(["notification_center"]);

export function LNSUpsellBanner({ location, ...boxProps }: Props) {
  return <View {...useLNSUpsellBannerModel(location)} {...boxProps} />;
}

function View({
  location,
  variant,
  copyKeys,
  discount,
  handleCTAClick,
  imageUrl,
  shouldUseLumenMediaBanner,
  ...boxProps
}: FlexBoxProps & LNSBannerModel): ReactElement | null {
  useViewNotification(location, variant);

  if (variant.type === "none") return null;

  if (shouldUseLumenMediaBanner) {
    const isFullWidth = FULL_WIDTH_BANNER_LOCATIONS.has(location);
    return (
      <Flex
        width={isFullWidth ? "100%" : "50%"}
        maxWidth={isFullWidth ? "100%" : "50%"}
        minWidth={0}
        alignSelf="flex-start"
        {...boxProps}
      >
        <LNSUpsellMediaBanner
          title={t(copyKeys.title)}
          description={t(copyKeys.description, { discount })}
          imageUrl={imageUrl}
          onClick={handleCTAClick}
        />
      </Flex>
    );
  }

  switch (variant.type) {
    case "banner":
      return (
        <BannerCard
          {...boxProps}
          title={t(copyKeys.title)}
          description={
            <Trans i18nKey={copyKeys.description} values={{ discount }}>
              <Text color="primary.c80" />
            </Trans>
          }
          cta={
            <Button variant="main" outline={false}>
              {t(copyKeys.cta)}
            </Button>
          }
          image={imageUrl}
          borderRadius="5px"
          onClick={handleCTAClick}
        />
      );

    case "notification":
      return (
        <NotificationCard
          {...boxProps}
          title={t(copyKeys.title)}
          description={
            <Trans i18nKey={copyKeys.description} values={{ discount }}>
              <span />
            </Trans>
          }
          cta={
            <Link alignSelf="start" color="primary.c80" size="small">
              {t(copyKeys.cta)}
              <Icons.ExternalLink size="S" style={{ marginLeft: "8px", verticalAlign: "middle" }} />
            </Link>
          }
          icon={variant.icon}
          onClick={handleCTAClick}
          isHighlighted
        />
      );

    default:
      return null;
  }
}
