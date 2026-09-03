import React from "react";
import { Image, type ImageSourcePropType } from "react-native";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { CoinsAddPlus, CreditCard, LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import heroImage from "./payCardLoginIntro.webp";
import type { CardLoginIntroRowIcon, CardLoginIntroViewProps } from "./types";

/** The hero fills its `Box`, which carries every design value. `flex` is layout, not a token. */
const FILL_STYLE = { flex: 1 } as const;

/**
 * `BottomSheetView` insets its own content by `s16` on every side. The design asks for `s24` at the
 * bottom, so the value is set here to replace that default rather than on a child, which would add
 * to it. Android's navigation bar is already cleared by `QueuedBottomSheet`.
 */
const CONTENT_STYLE = { paddingBottom: 24 } as const;

/** Static, so the row icon stays a name the type system checks and never a computed lookup. */
const ROW_ICONS: Record<CardLoginIntroRowIcon, typeof CreditCard> = {
  CoinsAddPlus,
  CreditCard,
  LedgerLogo,
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
        <BottomSheetView style={CONTENT_STYLE} testID="pay-card-login-intro-content">
          <BottomSheetHeader density="compact" />
          <Box lx={{ gap: "s16" }}>
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
            {/*
              Lumen's `ListItem` holds a row at one fixed height and cuts both of its lines off at
              the first, which suits a list of names and values. This copy is a sentence, and a
              translation of it is longer, so the rows are composed here to let it wrap instead.
            */}
            <Box lx={{ flexDirection: "column", gap: "s16" }}>
              {rows.map(row => {
                const RowIcon = ROW_ICONS[row.icon];
                return (
                  <Box
                    key={row.icon}
                    lx={{ flexDirection: "row", alignItems: "center", gap: "s12" }}
                    testID={`pay-card-login-intro-row-${row.icon}`}
                  >
                    {RowIcon ? <RowIcon size={24} /> : null}
                    <Box lx={{ flex: 1, flexDirection: "column", gap: "s4" }}>
                      <Text typography="body2SemiBold" lx={{ color: "base" }}>
                        {row.title}
                      </Text>
                      <Text typography="body3" lx={{ color: "muted" }}>
                        {row.description}
                      </Text>
                    </Box>
                  </Box>
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
