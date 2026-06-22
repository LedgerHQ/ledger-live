import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import * as Icons from "@ledgerhq/lumen-ui-rnative/symbols";
import { Image, Linking, StyleSheet } from "react-native";
import { useThemedAwarenessModalImage } from "../hooks/useThemedAwarenessModalImage";
import type { FeatureIntroViewModel } from "../screens/useGenericAwarenessModalDrawerViewModel";

type FeatureIntroLayoutProps = Readonly<{
  onClose: () => void;
  viewModel: FeatureIntroViewModel;
}>;

const TITLE_NUMBER_OF_LINES = 2;
const SUBTITLE_NUMBER_OF_LINES = 3;
const ITEM_TITLE_NUMBER_OF_LINES = 1;
const ITEM_SUBTITLE_NUMBER_OF_LINES = 2;
const FEATURE_INTRO_HERO_CONTAINER_LX = {
  borderRadius: "lg",
  borderWidth: "s1",
  borderColor: "icon",
  overflow: "hidden",
} as const;

export function FeatureIntroLayout({ onClose, viewModel }: FeatureIntroLayoutProps) {
  const { content } = viewModel;
  const {
    imageUrlLight,
    imageUrlDark,
    title,
    subtitle,
    items,
    primaryButtonLabel,
    primaryButtonLink,
    secondaryButtonLabel,
    secondaryButtonLink,
  } = content;
  const { imageUrl, showImage } = useThemedAwarenessModalImage({ imageUrlLight, imageUrlDark });

  const handleButtonPress = async (link: string, onPress: () => void) => {
    onPress();

    if (link) {
      try {
        await Linking.openURL(link);
      } catch {
        // TODO: track("malformed_url")
      } finally {
        requestAnimationFrame(onClose);
      }
      return;
    }

    onClose();
  };

  return (
    <Box lx={{ gap: "s16", marginTop: "s8" }}>
      {showImage ? (
        <Box
          lx={FEATURE_INTRO_HERO_CONTAINER_LX}
          testID="generic-awareness-modal-feature-intro-hero"
        >
          <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
        </Box>
      ) : null}

      <Text
        typography="heading3SemiBold"
        lx={{
          color: "base",
          marginBottom: "s2",
        }}
        numberOfLines={TITLE_NUMBER_OF_LINES}
      >
        {title}
      </Text>

      <Text
        typography="body2"
        lx={{
          color: "muted",
          marginBottom: "s8",
        }}
        numberOfLines={SUBTITLE_NUMBER_OF_LINES}
      >
        {subtitle}
      </Text>

      <Box lx={{ gap: "s20", marginBottom: "s20" }}>
        {items.map(item => {
          const Icon = Icons[item.icon as keyof typeof Icons] ?? Icons.Wallet;

          return (
            <Box key={item.title} lx={{ flexDirection: "row", gap: "s16", alignItems: "center" }}>
              <Icon size={24} />
              <Box lx={{ flex: 1, gap: "s4" }}>
                <Text
                  typography="body1SemiBold"
                  lx={{
                    color: "base",
                  }}
                  numberOfLines={ITEM_TITLE_NUMBER_OF_LINES}
                >
                  {item.title}
                </Text>
                <Text
                  typography="body2"
                  lx={{ color: "muted" }}
                  numberOfLines={ITEM_SUBTITLE_NUMBER_OF_LINES}
                >
                  {item.subtitle}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Button
        appearance="base"
        size="lg"
        onPress={() => handleButtonPress(primaryButtonLink, viewModel.onPrimaryPress)}
      >
        {primaryButtonLabel}
      </Button>
      <Button
        appearance="gray"
        size="lg"
        onPress={() => handleButtonPress(secondaryButtonLink, viewModel.onSecondaryPress)}
      >
        {secondaryButtonLabel}
      </Button>
    </Box>
  );
}

const styles = StyleSheet.create({
  heroImage: {
    width: "100%",
    height: 200,
  },
});
