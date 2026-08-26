import React from "react";
import { Banner, Tag } from "@ledgerhq/lumen-ui-react";
import { useThemeVariant } from "@features/platform-style/hooks";
import { Animation } from "./Animation.web";
import { getDeviceActionAnimation } from "./getDeviceActionAnimation.web";
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
}: DeviceActionContentProps): React.JSX.Element {
  const providerTheme = useThemeVariant();
  const resolvedTheme = theme ?? providerTheme;
  const animationSource =
    deviceModelId === null
      ? undefined
      : getDeviceActionAnimation({ action, modelId: deviceModelId, theme: resolvedTheme });

  return (
    <div
      className="flex w-full flex-col items-center gap-32 overflow-hidden pb-16"
      data-testid={testID}
    >
      <div className="flex w-full flex-col items-center gap-16">
        {animationSource ? (
          <div style={animationStyle} data-testid={testID ? `${testID}-animation` : undefined}>
            <Animation animation={animationSource} width="100%" height="100%" />
          </div>
        ) : null}
        {deviceName ? <Tag size="md" appearance="base" label={deviceName} /> : null}
      </div>

      {title || description ? (
        <div className="flex w-full flex-col items-center gap-8 break-words text-center">
          {title ? <h3 className="heading-4-semi-bold w-full text-base">{title}</h3> : null}
          {description ? <p className="body-2 w-full text-muted">{description}</p> : null}
        </div>
      ) : null}

      {banner ? (
        <div className="w-full">
          <Banner
            appearance={banner.appearance ?? "info"}
            title={banner.title}
            description={banner.description}
          />
        </div>
      ) : null}
    </div>
  );
}
