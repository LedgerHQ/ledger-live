import React from "react";
import { Banner, Box, Tag, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme as useStyledTheme } from "styled-components/native";
import Animation from "~/components/Animation";
import {
  getDeviceActionAnimation,
  getDeviceActionAnimationStyle,
} from "./getDeviceActionAnimation";
import type { DeviceActionAnimationTheme, DeviceActionContentProps } from "./types";

/**
 * Shared mobile layout for device-side actions with animation, copy, and banner.
 */
export function DeviceActionContent({
  title,
  description,
  deviceName,
  deviceModelId,
  action,
  banner,
  theme,
  testID,
}: DeviceActionContentProps) {
  const styledTheme = useStyledTheme();
  const resolvedTheme = theme ?? getStyledAnimationTheme(styledTheme);
  const animationSource = getDeviceActionAnimation({
    action,
    modelId: deviceModelId,
    theme: resolvedTheme,
  });

  return (
    <Box lx={rootStyle} testID={testID}>
      <Box lx={deviceSectionStyle}>
        {animationSource ? (
          <Animation
            source={animationSource}
            style={getDeviceActionAnimationStyle(deviceModelId)}
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

function getStyledAnimationTheme(styledTheme: { theme?: string }): DeviceActionAnimationTheme {
  return styledTheme.theme === "dark" ? "dark" : "light";
}

export {
  getDeviceActionAnimation,
  supportedDeviceActionModelIds,
} from "./getDeviceActionAnimation";

export type {
  DeviceActionAnimationSource,
  DeviceActionAnimationTheme,
  DeviceActionContentAction,
  DeviceActionContentBanner,
  DeviceActionContentProps,
  SupportedDeviceActionModelId,
} from "./types";
