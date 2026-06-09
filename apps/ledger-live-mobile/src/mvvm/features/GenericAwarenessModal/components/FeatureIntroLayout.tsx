import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import * as Icons from "@ledgerhq/lumen-ui-rnative/symbols";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
import { Image, Linking } from "react-native";
import type { FeatureIntroViewModel } from "../screens/useGenericAwarenessModalDrawerViewModel";

type FeatureIntroLayoutProps = Readonly<{
  onClose: () => void;
  viewModel: FeatureIntroViewModel;
}>;

const FEATURE_INTRO_IMAGE_HEIGHT = 192;
const TITLE_NUMBER_OF_LINES = 2;
const SUBTITLE_NUMBER_OF_LINES = 3;
const ITEM_TITLE_NUMBER_OF_LINES = 2;
const ITEM_SUBTITLE_NUMBER_OF_LINES = 2;

export function FeatureIntroLayout({ onClose, viewModel }: FeatureIntroLayoutProps) {
  const { content } = viewModel;
  const {
    imageUrl,
    title,
    subtitle,
    items,
    primaryButtonLabel,
    primaryButtonLink,
    secondaryButtonLabel,
    secondaryButtonLink,
  } = content;

  const isSecondaryExternalLink = secondaryButtonLink.startsWith("http");

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
      <Box lx={{ borderRadius: "xl", overflow: "hidden" }}>
        <Image
          source={{ uri: imageUrl }}
          style={{ width: "100%", height: FEATURE_INTRO_IMAGE_HEIGHT }}
          resizeMode="cover"
        />
      </Box>

      <Box lx={{ gap: "s4" }}>
        <Box lx={{ gap: "s8" }}>
          <Text
            typography="heading3SemiBold"
            lx={{
              color: "base",
            }}
            numberOfLines={TITLE_NUMBER_OF_LINES}
          >
            {title}
          </Text>

          <Text
            typography="body2"
            lx={{
              color: "muted",
            }}
            numberOfLines={SUBTITLE_NUMBER_OF_LINES}
          >
            {subtitle}
          </Text>
        </Box>

        <Box lx={{ gap: "s0" }}>
          {items.map(item => {
            const Icon = Icons[item.icon as keyof typeof Icons] ?? Icons.Wallet;

            return (
              <Box
                key={item.title}
                lx={{
                  flexDirection: "row",
                  alignItems: "center",
                  minHeight: "s64",
                  paddingVertical: "s12",
                }}
              >
                <Icon size={24} />
                <Box lx={{ marginLeft: "s12", flex: 1, gap: "s4" }}>
                  <Text
                    typography="body2SemiBold"
                    lx={{
                      color: "base",
                    }}
                    numberOfLines={ITEM_TITLE_NUMBER_OF_LINES}
                  >
                    {item.title}
                  </Text>
                  <Text
                    typography="body3"
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
      </Box>

      <Box lx={{ gap: "s16" }}>
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
          icon={isSecondaryExternalLink ? ExternalLink : undefined}
          onPress={() => handleButtonPress(secondaryButtonLink, viewModel.onSecondaryPress)}
        >
          {secondaryButtonLabel}
        </Button>
      </Box>
    </Box>
  );
}
