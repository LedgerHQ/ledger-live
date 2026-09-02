import React from "react";
import { Image, type ImageSourcePropType } from "react-native";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { CoinsAddPlus, CreditCard, Nano } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import heroImage from "./payCardLoginIntro.webp";
import type { CardLoginIntroRowIcon, CardLoginIntroViewProps } from "./types";

/** The hero fills its `Box`, which carries every design value. `flex` is layout, not a token. */
const FILL_STYLE = { flex: 1 } as const;

/** Static, so the row icon stays a name the type system checks and never a computed lookup. */
const ROW_ICONS: Record<CardLoginIntroRowIcon, typeof CreditCard> = {
  CoinsAddPlus,
  CreditCard,
  Nano,
};

/**
 * The intro the card holder sees on the first `Login` press. It draws and it reports, and nothing
 * more: `useCardLoginViewModel` owns how many logins a press may start.
 */
export function CardLoginIntroView({
  isOpen,
  title,
  providedBy,
  rows,
  actions,
  onActionPress,
  onClose,
}: CardLoginIntroViewProps) {
  return (
    <QueuedBottomSheet
      isForcingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      testID="pay-card-login-intro-sheet"
    >
      {isOpen ? (
        <BottomSheetView testID="pay-card-login-intro-content">
          <BottomSheetHeader density="compact" />
          <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s24", gap: "s16" }}>
            <Box
              lx={{ width: "full", height: "s192", borderRadius: "xl", overflow: "hidden" }}
              testID="pay-card-login-intro-hero"
            >
              <Image
                source={heroImage as unknown as ImageSourcePropType}
                resizeMode="cover"
                style={FILL_STYLE}
              />
            </Box>
            <Text accessibilityRole="header" typography="heading3SemiBold" lx={{ color: "base" }}>
              {title}
            </Text>
            <Box lx={{ flexDirection: "column" }}>
              {rows.map(row => {
                const RowIcon = ROW_ICONS[row.icon];
                return (
                  <ListItem key={row.icon} testID={`pay-card-login-intro-row-${row.icon}`}>
                    <ListItemLeading>
                      {RowIcon ? <RowIcon size={24} /> : null}
                      <ListItemContent>
                        <ListItemTitle>{row.title}</ListItemTitle>
                        <ListItemDescription>{row.description}</ListItemDescription>
                      </ListItemContent>
                    </ListItemLeading>
                  </ListItem>
                );
              })}
            </Box>
            <Box lx={{ flexDirection: "column", alignItems: "center", gap: "s16" }}>
              <Text
                typography="body3"
                lx={{ color: "muted", textAlign: "center" }}
                testID="pay-card-login-intro-provided-by"
              >
                {providedBy}
              </Text>
              {actions.map(action => (
                <Button
                  key={action.id}
                  appearance={action.appearance}
                  size="lg"
                  isFull
                  onPress={onActionPress}
                  accessibilityLabel={action.label}
                  testID={`pay-card-login-intro-${action.id}`}
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          </Box>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
