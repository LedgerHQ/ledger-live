import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import * as Icons from "@ledgerhq/lumen-ui-rnative/symbols";
import { Image, Linking } from "react-native";
import type { GenericAwarenessModalFeatureIntro } from "@ledgerhq/live-common/genericAwarenessModal";

type FeatureIntroContentProps = Readonly<{
  content: GenericAwarenessModalFeatureIntro;
  onClose: () => void;
}>;

export function FeatureIntroContent({ content, onClose }: FeatureIntroContentProps) {
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

  const handleButtonPress = async (link: string) => {
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
      <Box lx={{ borderRadius: "lg", overflow: "hidden" }}>
        <Image
          source={{ uri: imageUrl }}
          style={{ width: "100%", height: 200 }}
          resizeMode="cover"
        />
      </Box>

      <Text
        typography="heading3SemiBold"
        lx={{
          color: "base",
          marginBottom: "s2",
        }}
      >
        {title}
      </Text>

      <Text
        typography="body2"
        lx={{
          color: "muted",
          marginBottom: "s8",
        }}
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
                >
                  {item.title}
                </Text>
                <Text typography="body2" lx={{ color: "muted" }}>
                  {item.subtitle}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Button appearance="base" size="lg" onPress={() => handleButtonPress(primaryButtonLink)}>
        {primaryButtonLabel}
      </Button>
      <Button appearance="gray" size="lg" onPress={() => handleButtonPress(secondaryButtonLink)}>
        {secondaryButtonLabel}
      </Button>
    </Box>
  );
}
