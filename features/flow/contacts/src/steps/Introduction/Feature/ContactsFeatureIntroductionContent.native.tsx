import React from "react";
import { Image, type ImageSourcePropType } from "react-native";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import * as Icons from "@ledgerhq/lumen-ui-rnative/symbols";
import { CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE } from "./assets";
import type { ContactsFeatureIntroductionContentProps } from "./types";

export function ContactsFeatureIntroductionContent({
  isOpen,
  title,
  description,
  highlights,
  primaryActionLabel,
  secondaryActionLabel,
  heroImageSrc,
  bottomInset,
  onComplete,
  onDefer,
}: ContactsFeatureIntroductionContentProps): React.JSX.Element {
  const heroImage = heroImageSrc ?? CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE;

  return (
    <BottomSheetView
      style={{
        paddingHorizontal: 0,
        paddingBottom: bottomInset + 24,
      }}
    >
      {isOpen ? (
        <>
          <BottomSheetHeader spacing />
          <Box lx={{ gap: "s16", paddingHorizontal: "s16" }}>
            <Box
              testID="contacts-feature-introduction-hero"
              style={{
                height: 200,
                width: "100%",
                borderRadius: 12,
                overflow: "hidden",
              }}
              lx={{ backgroundColor: "muted" }}
            >
              <Image
                source={heroImage as ImageSourcePropType}
                accessibilityIgnoresInvertColors
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </Box>
            <Box lx={{ gap: "s8" }}>
              <Text typography="heading3SemiBold" lx={{ color: "base" }}>
                {title}
              </Text>
              <Text typography="body2" lx={{ color: "muted" }}>
                {description}
              </Text>
            </Box>
            {highlights.map(highlight => {
              const HighlightIcon = Icons[highlight.icon];

              return (
                <Box key={highlight.icon} lx={{ flexDirection: "row", gap: "s12" }}>
                  <HighlightIcon />
                  <Box lx={{ flex: 1, gap: "s4" }}>
                    <Text typography="body1SemiBold" lx={{ color: "base" }}>
                      {highlight.title}
                    </Text>
                    <Text typography="body2" lx={{ color: "muted" }}>
                      {highlight.description}
                    </Text>
                  </Box>
                </Box>
              );
            })}
            <Box lx={{ gap: "s12", paddingTop: "s8" }}>
              <Button
                appearance="base"
                size="lg"
                isFull
                onPress={onComplete}
                testID="contacts-feature-introduction-primary"
              >
                {primaryActionLabel}
              </Button>
              <Button
                appearance="gray"
                size="lg"
                isFull
                onPress={onDefer}
                testID="contacts-feature-introduction-secondary"
              >
                {secondaryActionLabel}
              </Button>
            </Box>
          </Box>
        </>
      ) : null}
    </BottomSheetView>
  );
}
