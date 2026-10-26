import React from "react";
import { Image, type ImageSourcePropType } from "react-native";
import {
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
import { LedgerLogo, Planet } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import heroImage from "../../assets/predictions-intro.webp";
import type { IntroContentProps } from "./IntroContent.types";

const HERO_STYLE = { width: "100%", height: 200 } as const;

const ITEMS = [
  { key: "polymarket", Icon: LedgerLogo },
  { key: "markets", Icon: Planet },
  { key: "clearSign", Icon: LedgerLogo },
] as const;

export function IntroContent({ onDiscover, onLearnMore }: IntroContentProps) {
  const { t } = useTranslation();
  const bottomInset = useBottomSheetBottomInset();

  return (
    // The sheet sizes itself to this scroll view, so the header and actions live inside it.
    <BottomSheetScrollView alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
      <BottomSheetHeader density="compact" spacing />
      <Box lx={{ gap: "s24" }} style={{ paddingBottom: bottomInset + 16 }}>
        <Box lx={{ borderRadius: "lg", overflow: "hidden" }}>
          <Image
            source={heroImage as unknown as ImageSourcePropType}
            resizeMode="cover"
            style={HERO_STYLE}
            testID="predictions-intro-hero-image"
          />
        </Box>
        <Box lx={{ gap: "s4" }}>
          <Box lx={{ gap: "s8", paddingBottom: "s12" }}>
            <Text accessibilityRole="header" typography="heading2SemiBold" lx={{ color: "base" }}>
              {t("predictions.onboarding.intro.title")}
            </Text>
            <Text typography="body2" lx={{ color: "muted" }}>
              {t("predictions.onboarding.intro.subtitle")}
            </Text>
          </Box>
          <Box>
            {ITEMS.map(({ key, Icon }) => (
              <ListItem key={key} lx={{ paddingHorizontal: "s0" }}>
                <ListItemLeading>
                  <Icon size={24} />
                  <ListItemContent>
                    <ListItemTitle>
                      {t(`predictions.onboarding.intro.items.${key}.title`)}
                    </ListItemTitle>
                    <ListItemDescription>
                      {t(`predictions.onboarding.intro.items.${key}.subtitle`)}
                    </ListItemDescription>
                  </ListItemContent>
                </ListItemLeading>
              </ListItem>
            ))}
          </Box>
        </Box>
        <Box lx={{ gap: "s16" }}>
          <Button appearance="base" size="lg" isFull onPress={onDiscover}>
            {t("predictions.onboarding.intro.discover")}
          </Button>
          <Button appearance="no-background" size="sm" isFull onPress={onLearnMore}>
            {t("predictions.onboarding.intro.learnMore")}
          </Button>
        </Box>
      </Box>
    </BottomSheetScrollView>
  );
}
