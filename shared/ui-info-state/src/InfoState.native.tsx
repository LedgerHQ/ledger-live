import React from "react";
import { Banner, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useBottomSheetBackgroundTone } from "@shared/ui-queued-bottom-sheet";
import type { InfoStateProps } from "./InfoState.types";
import { InfoStateButton } from "./components/InfoStateButton";
import { PresetVisual } from "./components/PresetVisual";
import {
  actionsStyle,
  contentStyle,
  fullWidthStyle,
  infoStateStyle,
  rootStyle,
  titleDescriptionStyle,
} from "./styles";
import { getInfoStateSheetTone } from "./utils/getInfoStateSheetTone";

/**
 * Shared native state layout for informational, success, and error screens.
 */
export function InfoState(props: InfoStateProps) {
  const {
    title,
    description,
    content,
    primaryCta,
    secondaryCta,
    banner,
    size = "full-height",
    testID,
  } = props;
  const isTextPreset = props.preset === "text";
  const isFullHeight = size === "full-height";
  useBottomSheetBackgroundTone(getInfoStateSheetTone(props));

  return (
    <Box lx={rootStyle(isFullHeight)} testID={testID}>
      <Box lx={infoStateStyle(isFullHeight)}>
        <Box lx={contentStyle(isFullHeight, isTextPreset)}>
          <PresetVisual {...props} />
          {title || description ? (
            <Box lx={titleDescriptionStyle}>
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
        </Box>

        {content ? <Box lx={fullWidthStyle}>{content}</Box> : null}

        {banner ? (
          <Box lx={fullWidthStyle}>
            <Banner
              appearance={banner.appearance ?? "info"}
              title={banner.title}
              description={banner.description}
              testID={banner.testID}
            />
          </Box>
        ) : null}

        {primaryCta || secondaryCta ? (
          <Box lx={actionsStyle}>
            {primaryCta ? <InfoStateButton cta={primaryCta} appearance="base" /> : null}
            {secondaryCta ? <InfoStateButton cta={secondaryCta} appearance="gray" /> : null}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
