import React from "react";
import { Banner, Box, Tag, Text } from "@ledgerhq/lumen-ui-rnative";
import { useThemeVariant } from "@features/platform-style/hooks";
import { Animation } from "./Animation.native";
import { getDeviceActionAnimation } from "./getDeviceActionAnimation.native";
import type { DeviceActionContentProps } from "./types";

const animationStyle = { height: 200, width: 200 };

/**
 * Shared layout for device-side actions with animation, copy, and banner.
 */
export function DeviceActionContent({
  title,
  description,
  deviceName,
  deviceModelId,
  action,
  theme,
  banner,
  testID,
}: DeviceActionContentProps) {
  const providerTheme = useThemeVariant();
  const resolvedTheme = theme ?? providerTheme;
  const animationSource =
    deviceModelId === null
      ? undefined
      : getDeviceActionAnimation({ action, modelId: deviceModelId, theme: resolvedTheme });

  return (
    <Box lx={rootStyle} testID={testID}>
      <Box lx={deviceSectionStyle}>
        {animationSource ? (
          <Animation
            source={animationSource}
            style={animationStyle}
            testID={testID ? `${testID}-animation` : undefined}
          />
        ) : null}
        {deviceName ? <Tag size="md" appearance="gray" label={deviceName} /> : null}
      </Box>

      {title || description ? (
        <Box lx={contentSectionStyle}>
          {title ? (
            <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
              {title}
            </Text>
          ) : null}
          {description ? (
            <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
              {description}
            </Text>
          ) : null}
        </Box>
      ) : null}

      {banner ? (
        <Box lx={bannerSectionStyle}>
          <Banner
            appearance={banner.appearance ?? "info"}
            title={banner.title}
            description={banner.description}
          />
        </Box>
      ) : null}
    </Box>
  );
}

const rootStyle = {
  alignItems: "center",
  gap: "s32",
  overflow: "hidden",
  paddingBottom: "s16",
  width: "full",
} as const;

const deviceSectionStyle = {
  alignItems: "center",
  gap: "s16",
  width: "full",
} as const;

const contentSectionStyle = {
  alignItems: "center",
  gap: "s8",
  width: "full",
} as const;

const bannerSectionStyle = {
  width: "full",
} as const;
