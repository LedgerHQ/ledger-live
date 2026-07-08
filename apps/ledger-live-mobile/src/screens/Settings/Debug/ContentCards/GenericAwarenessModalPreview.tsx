import React from "react";
import { Image, StyleSheet } from "react-native";
import { Box, Button, PageIndicator, Text } from "@ledgerhq/lumen-ui-rnative";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import { useThemedAwarenessModalImage } from "LLM/features/GenericAwarenessModal/hooks/useThemedAwarenessModalImage";
import type { GenericAwarenessModalDebugFormValues } from "~/dynamicContent/buildLocalGenericAwarenessModalCards";
import { ShapeTag } from "./shared";

type GenericAwarenessModalPreviewProps = Readonly<{
  form: GenericAwarenessModalDebugFormValues;
}>;

export function GenericAwarenessModalPreview({ form }: GenericAwarenessModalPreviewProps) {
  const isCarousel = form.layout === GenericAwarenessModalLayout.Carousel;
  const isFeatureIntro = form.layout === GenericAwarenessModalLayout.FeatureIntro;
  const firstItem = isCarousel ? form.items[0] : undefined;
  const { imageUrl, showImage } = useThemedAwarenessModalImage({
    imageUrlLight: firstItem?.imageUrlLight ?? form.imageUrlLight,
    imageUrlDark: firstItem?.imageUrlDark ?? form.imageUrlDark,
  });
  const title = firstItem?.title ?? form.title;
  const subtitle = firstItem?.subtitle ?? form.subtitle;
  const primaryButtonLabel = firstItem?.primaryButtonLabel ?? form.primaryButtonLabel;

  return (
    <Box lx={{ gap: "s8", marginBottom: "s16" }}>
      <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
        <ShapeTag shape="gam" />
        <Text typography="body2SemiBold" lx={{ color: "base" }}>
          Preview
        </Text>
      </Box>
      <Box
        lx={{
          backgroundColor: "surface",
          borderRadius: "md",
          padding: "s16",
          gap: "s12",
          overflow: "hidden",
        }}
      >
        {showImage ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : null}
        {title ? (
          <Text typography="heading3SemiBold" lx={{ color: "base" }}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text typography="body2" lx={{ color: "muted" }}>
            {subtitle}
          </Text>
        ) : null}
        {isFeatureIntro && form.items.length > 0 ? (
          <Box lx={{ gap: "s4" }}>
            {form.items.map((item, index) => (
              <Text key={`${item.title}-${index}`} typography="body2" lx={{ color: "muted" }}>
                • {item.title}
              </Text>
            ))}
          </Box>
        ) : null}
        {isCarousel && form.items.length > 1 ? (
          <PageIndicator currentPage={1} totalPages={form.items.length} />
        ) : null}
        {primaryButtonLabel ? (
          <Button appearance="base" size="md" disabled>
            {primaryButtonLabel}
          </Button>
        ) : null}
      </Box>
      <Text typography="body2" lx={{ color: "muted" }}>
        Approximate render - not clickable, spacing/theme may differ from the real placement.
      </Text>
    </Box>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 160,
    borderRadius: 8,
  },
});
