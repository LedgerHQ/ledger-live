import React, { useCallback, useRef } from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { Image, Linking } from "react-native";
import { useThemedAwarenessModalImage } from "LLM/features/GenericAwarenessModal/hooks/useThemedAwarenessModalImage";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";

const CONTENT_MAX_WIDTH = "s400";
const HERO_MAX_WIDTH = 343;
const HERO_ASPECT_RATIO = 343 / 473;
const TITLE_NUMBER_OF_LINES = 2;
const SUBTITLE_NUMBER_OF_LINES = 3;
const HERO_CONTAINER_STYLE = {
  maxWidth: HERO_MAX_WIDTH,
  aspectRatio: HERO_ASPECT_RATIO,
  overflow: "hidden",
} as const;
const HERO_IMAGE_STYLE = { flex: 1, width: "100%" } as const;

type LargeScreenUpsellModalContentProps = Readonly<{
  viewModel: FeatureIntroViewModel;
  heroHeight: number;
}>;

export function LargeScreenUpsellModalContent({
  viewModel,
  heroHeight,
}: LargeScreenUpsellModalContentProps) {
  const { content, onPrimaryPress } = viewModel;
  const { imageUrlLight, imageUrlDark, title, subtitle, primaryButtonLabel, primaryButtonLink } =
    content;
  const { imageUrl, showImage } = useThemedAwarenessModalImage({ imageUrlLight, imageUrlDark });
  const isHandlingCtaPressRef = useRef(false);
  const resolvedPrimaryButtonLink = primaryButtonLink.trim();
  const showPrimaryButton =
    primaryButtonLabel.trim().length > 0 && resolvedPrimaryButtonLink.length > 0;

  const handleCtaPress = useCallback(async () => {
    if (isHandlingCtaPressRef.current) {
      return;
    }

    isHandlingCtaPressRef.current = true;

    try {
      await Linking.openURL(resolvedPrimaryButtonLink);
      onPrimaryPress();
    } catch {
      return;
    } finally {
      isHandlingCtaPressRef.current = false;
    }
  }, [onPrimaryPress, resolvedPrimaryButtonLink]);

  return (
    <Box lx={{ alignItems: "center", paddingHorizontal: "s16", paddingBottom: "s24" }}>
      <Box lx={{ width: "full", maxWidth: CONTENT_MAX_WIDTH }}>
        {showImage ? (
          <Box
            lx={{ alignSelf: "center" }}
            style={[HERO_CONTAINER_STYLE, { height: heroHeight }]}
            testID="large-screen-upsell-modal-hero-container"
          >
            <Image
              source={{ uri: imageUrl }}
              style={HERO_IMAGE_STYLE}
              resizeMode="contain"
              testID="large-screen-upsell-modal-hero"
            />
          </Box>
        ) : null}

        <Box lx={{ paddingTop: "s24", width: "full" }}>
          <Text
            typography="heading3SemiBold"
            lx={{ color: "base", textAlign: "center" }}
            numberOfLines={TITLE_NUMBER_OF_LINES}
          >
            {title}
          </Text>

          <Box lx={{ paddingTop: "s8" }}>
            <Text
              typography="body2"
              lx={{ color: "muted", textAlign: "center" }}
              numberOfLines={SUBTITLE_NUMBER_OF_LINES}
            >
              {subtitle}
            </Text>
          </Box>
        </Box>

        {showPrimaryButton ? (
          <Box lx={{ paddingTop: "s40", width: "full" }}>
            <Button
              appearance="base"
              size="lg"
              isFull
              onPress={handleCtaPress}
              testID="large-screen-upsell-modal-primary-button"
            >
              {primaryButtonLabel}
            </Button>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
