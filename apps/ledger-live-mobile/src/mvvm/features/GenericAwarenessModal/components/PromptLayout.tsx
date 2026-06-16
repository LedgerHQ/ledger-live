import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { Linking, StyleSheet } from "react-native";
import FastImage from "react-native-fast-image";
import { useTranslation } from "~/context/Locale";
import { useThemedAwarenessModalImage } from "../hooks/useThemedAwarenessModalImage";
import type { PromptViewModel } from "../screens/useGenericAwarenessModalDrawerViewModel";

type PromptLayoutProps = Readonly<{
  onClose: () => void;
  viewModel: PromptViewModel;
}>;

export function PromptLayout({ onClose, viewModel }: PromptLayoutProps) {
  const { t } = useTranslation();
  const { content } = viewModel;
  const { imageUrlLight, imageUrlDark, title, subtitle, primaryButtonLabel, primaryButtonLink } =
    content;
  const { imageUrl, showImage } = useThemedAwarenessModalImage({ imageUrlLight, imageUrlDark });
  const shouldShowPrimaryButton = Boolean(primaryButtonLabel && primaryButtonLink);

  const handleClosePress = () => {
    viewModel.onClosePress();
    onClose();
  };

  const handlePrimaryPress = async () => {
    if (!primaryButtonLink) {
      return;
    }

    const isExternalLink = primaryButtonLink.startsWith("http");
    viewModel.onPrimaryPress();

    try {
      await Linking.openURL(primaryButtonLink);
      if (!isExternalLink) {
        requestAnimationFrame(onClose);
      }
    } catch {
      viewModel.onMalformedUrl();
    }
  };

  return (
    <Box lx={{ flex: 1 }}>
      {showImage ? (
        <Box
          lx={{ flex: 1, alignItems: "center", justifyContent: "flex-end", marginBottom: "s20" }}
        >
          <FastImage
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.cover}
          />
        </Box>
      ) : null}
      <Box lx={{ marginBottom: "s24" }}>
        <Text
          typography="heading2SemiBold"
          lx={{ color: "base", textAlign: "center", marginBottom: "s4" }}
        >
          {title}
        </Text>
        <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
          {subtitle}
        </Text>
      </Box>
      <Box lx={{ gap: "s12" }}>
        <Button appearance="base" size="lg" onPress={handleClosePress}>
          {t("common.close")}
        </Button>
        {shouldShowPrimaryButton ? (
          <Button appearance="gray" size="lg" onPress={handlePrimaryPress}>
            {primaryButtonLabel}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "80%",
    aspectRatio: 9 / 16,
  },
});
