import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { useTranslation } from "~/context/Locale";
import { getDeviceSymbolByModelId } from "LLM/utils/getDeviceIcon";
import {
  useOsUpdateBannerViewModel,
  type OsUpdateBannerVariant,
} from "./useOsUpdateBannerViewModel";

type BannerContentProps = Readonly<{
  version: string;
  deviceModelId: DeviceModelId | undefined;
  onClickUpdate: () => void;
}>;

function PortfolioBanner({ deviceModelId, onClickUpdate }: BannerContentProps) {
  const { t } = useTranslation();
  return (
    <Box lx={{ alignItems: "center", paddingTop: "s24" }}>
      <Button
        appearance="transparent"
        size="sm"
        icon={getDeviceSymbolByModelId(deviceModelId)}
        onPress={onClickUpdate}
        testID="os-update-banner"
      >
        {t("osUpdates.banner.wallet40.title.default")}
      </Button>
    </Box>
  );
}

function MyLedgerBanner({ version, onClickUpdate }: BannerContentProps) {
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

function OsUpdateBannerView(props: BannerContentProps & { variant: OsUpdateBannerVariant }) {
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

export function OsUpdateBanner() {
  return <OsUpdateBannerView {...useOsUpdateBannerViewModel()} />;
}
