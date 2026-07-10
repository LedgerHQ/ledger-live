import React, { useCallback } from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { Image, Linking, StyleSheet } from "react-native";
import { useThemedAwarenessModalImage } from "LLM/features/GenericAwarenessModal/hooks/useThemedAwarenessModalImage";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";

const CONTENT_MAX_WIDTH = 343;
const HERO_HEIGHT = 305;
const HERO_ASPECT_RATIO = 343 / 473;
const IMAGE_TEXT_SPACING = 24;
const DESCRIPTION_TOP_PADDING = 8;
const TEXT_BUTTON_SPACING = 36;
const TITLE_NUMBER_OF_LINES = 2;
const SUBTITLE_NUMBER_OF_LINES = 3;

type LargeScreenUpsellModalContentProps = Readonly<{
  onClose: () => void;
  onCtaPress: () => void;
  viewModel: FeatureIntroViewModel;
}>;

export function LargeScreenUpsellModalContent({
  onClose,
  onCtaPress,
  viewModel,
}: LargeScreenUpsellModalContentProps) {
  const { content } = viewModel;
  const { imageUrlLight, imageUrlDark, title, subtitle, primaryButtonLabel, primaryButtonLink } =
    content;
  const { imageUrl, showImage } = useThemedAwarenessModalImage({ imageUrlLight, imageUrlDark });

  const handleCtaPress = useCallback(async () => {
    onCtaPress();

    if (!primaryButtonLink) {
      onClose();
      return;
    }

    await Linking.openURL(primaryButtonLink).catch(() => undefined);
    requestAnimationFrame(onClose);
  }, [onClose, onCtaPress, primaryButtonLink]);

  const textContent = (
    <Box style={styles.fullWidth}>
      <Text
        typography="heading3SemiBold"
        lx={{ color: "base", textAlign: "center" }}
        numberOfLines={TITLE_NUMBER_OF_LINES}
      >
        {title}
      </Text>

      <Box style={styles.subtitleContainer}>
        <Text
          typography="body2"
          lx={{ color: "muted", textAlign: "center" }}
          numberOfLines={SUBTITLE_NUMBER_OF_LINES}
        >
          {subtitle}
        </Text>
      </Box>
    </Box>
  );

  return (
    <Box lx={{ alignItems: "center", paddingHorizontal: "s16", paddingBottom: "s24" }}>
      <Box style={styles.content}>
        {showImage ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.heroImage}
            resizeMode="contain"
            testID="large-screen-upsell-modal-hero"
          />
        ) : null}

        <Box style={styles.textContainer}>{textContent}</Box>

        <Box style={styles.ctaContainer}>
          <Button appearance="base" size="lg" isFull onPress={handleCtaPress}>
            {primaryButtonLabel}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
  },
  fullWidth: {
    width: "100%",
  },
  textContainer: {
    width: "100%",
    paddingTop: IMAGE_TEXT_SPACING,
  },
  subtitleContainer: {
    paddingTop: DESCRIPTION_TOP_PADDING,
  },
  ctaContainer: {
    width: "100%",
    paddingTop: TEXT_BUTTON_SPACING,
  },
  heroImage: {
    alignSelf: "center",
    aspectRatio: HERO_ASPECT_RATIO,
    height: HERO_HEIGHT,
  },
});
