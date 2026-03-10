import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import { Button, Text } from "@ledgerhq/react-ui";
import TopBanner from "~/renderer/components/TopBanner";
import Box from "~/renderer/components/Box";
import { radii } from "~/renderer/styles/theme";

export type FirmwareUpdateBannerLegacyProps = {
  old?: boolean;
  right?: React.ReactNode;
  visibleFirmwareVersion: string;
  onClick: () => void;
};

/**
 * Legacy firmware banner (react-ui).
 * Keep in renderer until we remove the old flow; then delete this file and the
 * branch in FirmwareUpdateBanner.tsx that uses it.
 */
export function FirmwareUpdateBannerLegacy({
  old,
  right,
  visibleFirmwareVersion,
  onClick,
}: FirmwareUpdateBannerLegacyProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <TopBanner
      id="fw-update-banner"
      testId="fw-update-banner"
      containerStyle={{
        background: `linear-gradient(to left, ${colors.primary.c70}, ${colors.primary.c60})`,
        borderRadius: radii[2],
        padding: "12px 16px",
      }}
      content={{
        message: (
          <Box>
            <Text fontFamily="Inter|Bold" fontSize={5} color="neutral.c100">
              {t(old ? "manager.firmware.banner.old.warning" : "manager.firmware.banner.warning")}
            </Text>
            {old ? null : (
              <Text color="neutral.c90">
                {t("manager.firmware.banner.version", {
                  latestFirmware: visibleFirmwareVersion,
                })}
              </Text>
            )}
          </Box>
        ),
        right: right ?? (
          <Button variant="main" onClick={onClick}>
            {t("manager.firmware.banner.cta")}
          </Button>
        ),
      }}
    />
  );
}
