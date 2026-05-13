import React from "react";
import { StyleSheet } from "react-native";
import { Banner, Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import type { InfoStateCta, InfoStateProps } from "./types";

/**
 * Shared mobile state layout for informational, success, and error screens.
 */
export function InfoState(props: InfoStateProps) {
  const {
    title,
    description,
    primaryCta,
    secondaryCta,
    banner,
    size = "full-height",
    testID,
  } = props;
  const isTextPreset = props.preset === "text";
  const isFullHeight = size === "full-height";

  return (
    <Box lx={rootStyle} testID={testID}>
      <Box lx={infoStateStyle} style={isFullHeight ? styles.fullHeight : undefined}>
        <Box lx={contentStyle(isFullHeight, isTextPreset)}>
          {renderPresetVisual(props)}
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

        {banner ? (
          <Box lx={fullWidthStyle}>
            <Banner
              appearance={banner.appearance ?? "info"}
              title={banner.title}
              description={banner.description}
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

function renderPresetVisual(presetProps: InfoStateProps): React.ReactNode {
  const preset = presetProps.preset;

  switch (preset) {
    case "illustration":
      return (
        <Box lx={illustrationSlotStyle} style={styles.illustrationSlot}>
          {presetProps.illustration}
        </Box>
      );
    case "spot":
      return <Spot appearance="icon" size={72} icon={presetProps.spotProps.icon} />;
    case "success":
      return <Spot appearance="check" size={72} />;
    case "error":
      return <Spot appearance="error" size={72} />;
    case "info":
      return <Spot appearance="info" size={72} />;
    case "text":
      return null;
    default:
      return assertNever(preset);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled info state preset: ${value}`);
}

function InfoStateButton({
  cta,
  appearance,
}: Readonly<{
  cta: InfoStateCta;
  appearance: "base" | "gray";
}>) {
  return (
    <Button
      appearance={appearance}
      size="lg"
      lx={{ width: "full" }}
      onPress={cta.onPress}
      disabled={cta.disabled}
      testID={cta.testID}
    >
      {cta.label}
    </Button>
  );
}

const rootStyle = {
  width: "full",
} as const;

const infoStateStyle = {
  gap: "s32",
  paddingVertical: "s24",
  width: "full",
} as const;

const contentStyle = (isFullHeight: boolean, isTextPreset: boolean) =>
  ({
    alignItems: "center",
    flex: isFullHeight ? 1 : undefined,
    gap: isTextPreset ? "s0" : "s24",
    justifyContent: "center",
    width: "full",
  }) as const;

const titleDescriptionStyle = {
  alignItems: "center",
  gap: "s8",
  width: "full",
} as const;

const fullWidthStyle = {
  width: "full",
} as const;

const actionsStyle = {
  gap: "s16",
  width: "full",
} as const;

const illustrationSlotStyle = {
  alignItems: "center",
  borderRadius: "sm",
  justifyContent: "center",
  overflow: "hidden",
} as const;

const styles = StyleSheet.create({
  fullHeight: {
    minHeight: 440,
  },
  illustrationSlot: {
    height: 208,
    width: 208,
  },
});

export type {
  InfoStateBanner,
  InfoStateCta,
  InfoStatePreset,
  InfoStateProps,
  InfoStateSpotProps,
} from "./types";
