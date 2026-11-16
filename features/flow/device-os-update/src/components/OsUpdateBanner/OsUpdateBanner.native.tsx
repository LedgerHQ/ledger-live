import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import {
  useOsUpdateBannerViewModel,
  type OsUpdateBannerProps,
  type OsUpdateBannerViewProps,
} from "./useOsUpdateBannerViewModel";

type BannerContentProps = Omit<OsUpdateBannerViewProps, "variant">;

function PortfolioBanner({ DeviceIcon, onClickUpdate }: Readonly<BannerContentProps>) {
  const { t } = useTranslation();
  return (
    <Box lx={{ alignItems: "center", paddingTop: "s24" }}>
      <Button
        appearance="transparent"
        size="sm"
        icon={DeviceIcon}
        onPress={onClickUpdate}
        testID="os-update-banner"
      >
        {t("osUpdates.banner.wallet40.title.default")}
      </Button>
    </Box>
  );
}

function MyLedgerBanner({ version, onClickUpdate }: Readonly<BannerContentProps>) {
  const { t } = useTranslation();
  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "accent",
        borderRadius: "xl",
        padding: "s16",
      }}
      testID="os-update-banner"
    >
      <Box lx={{ flexDirection: "column", alignItems: "flex-start", flexShrink: 1 }}>
        <Text typography="heading5SemiBold" lx={{ color: "black" }}>
          {t("osUpdates.banner.wallet40.title.manager")}
        </Text>
        <Text typography="body2" lx={{ color: "black" }}>
          {t("osUpdates.banner.wallet40.version", { firmwareVersion: version })}
        </Text>
      </Box>
      <Box>
        <Button appearance="gray" size="sm" onPress={onClickUpdate}>
          {t("osUpdates.banner.wallet40.cta")}
        </Button>
      </Box>
    </Box>
  );
}

function OsUpdateBannerView(props: Readonly<OsUpdateBannerViewProps>) {
  switch (props.variant) {
    case "hidden":
      return null;
    case "portfolio":
      return <PortfolioBanner {...props} />;
    case "myLedger":
      return <MyLedgerBanner {...props} />;
    default: {
      const unhandled: never = props.variant;
      return unhandled;
    }
  }
}

export function OsUpdateBanner(props: OsUpdateBannerProps) {
  return <OsUpdateBannerView {...useOsUpdateBannerViewModel(props)} />;
}
