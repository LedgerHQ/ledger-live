import React from "react";
import { Image, type ImageSourcePropType } from "react-native";
import {
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetScrollView,
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import * as Icons from "@ledgerhq/lumen-ui-rnative/symbols";
import { CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE } from "./assets";
import type { ContactsFeatureIntroductionContentProps } from "./types";

export function ContactsFeatureIntroductionContent({
  isOpen,
  title,
  highlights,
  primaryActionLabel,
  heroImageSrc,
  bottomInset,
  onComplete,
}: ContactsFeatureIntroductionContentProps): React.JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  const heroImage = heroImageSrc ?? CONTACTS_FEATURE_INTRODUCTION_HERO_IMAGE;

  return (
    <>
      <BottomSheetHeader spacing />
      <BottomSheetScrollView
        testID="contacts-feature-introduction-content"
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={false}
      >
        <Box lx={{ gap: "s16", paddingBottom: "s16" }}>
          <Box
            testID="contacts-feature-introduction-hero"
            style={{
              height: 192,
              width: "100%",
              borderRadius: 24,
              overflow: "hidden",
            }}
            lx={{ backgroundColor: "muted" }}
          >
            <Image
              testID="contacts-feature-introduction-hero-image"
              source={heroImage as ImageSourcePropType}
              accessibilityIgnoresInvertColors
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </Box>
          <Box lx={{ gap: "s4" }}>
            <Box lx={{ gap: "s8", paddingBottom: "s8" }}>
              <Text typography="heading3SemiBold" lx={{ color: "base" }}>
                {title}
              </Text>
            </Box>
            <Box>
              {highlights.map(highlight => {
                const HighlightIcon = Icons[highlight.icon];

                return (
                  <ListItem
                    key={highlight.icon}
                    density="expanded"
                    testID={`contacts-feature-introduction-highlight-${highlight.icon}`}
                    lx={{ marginHorizontal: "-s8" }}
                  >
                    <ListItemLeading>
                      <HighlightIcon size={24} />
                      <ListItemContent>
                        <ListItemTitle>{highlight.title}</ListItemTitle>
                        <ListItemDescription>{highlight.description}</ListItemDescription>
                      </ListItemContent>
                    </ListItemLeading>
                  </ListItem>
                );
              })}
            </Box>
          </Box>
        </Box>
      </BottomSheetScrollView>
      <BottomSheetFooter style={{ paddingBottom: bottomInset + 24 }}>
        <Button
          appearance="base"
          size="lg"
          isFull
          onPress={onComplete}
          testID="contacts-feature-introduction-primary"
        >
          {primaryActionLabel}
        </Button>
      </BottomSheetFooter>
    </>
  );
}
