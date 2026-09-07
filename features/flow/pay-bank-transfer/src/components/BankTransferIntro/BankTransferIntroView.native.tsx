import React, { useCallback, useEffect, useRef } from "react";
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
import * as Icons from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { BankTransferIntroViewProps } from "../../types";

export function BankTransferIntroView({
  isOpen,
  title,
  description,
  createAccountLabel,
  logInLabel,
  providedBy,
  heroImage,
  rows,
  bottomInset,
  onShown,
  onCreateAccountPress,
  onLogInPress,
  onClosePress,
  onDismiss,
}: BankTransferIntroViewProps) {
  const acted = useRef(false);
  const onShownRef = useRef(onShown);
  onShownRef.current = onShown;

  useEffect(() => {
    if (isOpen) {
      acted.current = false;
      onShownRef.current();
    }
  }, [isOpen]);

  const actOnce = useCallback((action: () => void) => {
    if (acted.current) {
      return;
    }
    acted.current = true;
    action();
  }, []);

  const handleCreateAccount = useCallback(() => {
    actOnce(onCreateAccountPress);
  }, [actOnce, onCreateAccountPress]);

  const handleLogIn = useCallback(() => {
    actOnce(onLogInPress);
  }, [actOnce, onLogInPress]);

  const handleClosePress = useCallback(() => {
    actOnce(onClosePress);
  }, [actOnce, onClosePress]);

  const handleDismiss = useCallback(() => {
    actOnce(onDismiss);
  }, [actOnce, onDismiss]);

  return (
    <QueuedBottomSheet
      isForcingToBeOpened={isOpen}
      onClose={handleDismiss}
      onHeaderClosePressed={handleClosePress}
      enableDynamicSizing
      testID="pay-bank-transfer-intro-sheet"
    >
      {isOpen ? (
        <BottomSheetView
          style={{ paddingBottom: bottomInset + 16 }}
          testID="pay-bank-transfer-intro-content"
        >
          <BottomSheetHeader density="expanded" />
          <Box lx={{ gap: "s16" }}>
            {heroImage ? (
              <Image
                source={heroImage as ImageSourcePropType}
                resizeMode="cover"
                style={{ width: "100%", height: 192, borderRadius: 12 }}
                testID="pay-bank-transfer-intro-hero"
              />
            ) : null}
            <Box lx={{ flexDirection: "column", gap: "s8" }}>
              <Text accessibilityRole="header" typography="heading3SemiBold" lx={{ color: "base" }}>
                {title}
              </Text>
              <Text typography="body2" lx={{ color: "muted" }}>
                {description}
              </Text>
            </Box>
            <Box lx={{ flexDirection: "column" }}>
              {rows.map((row, index) => {
                const RowIcon = Icons[row.icon];
                return (
                  <ListItem
                    key={`${row.icon}-${index}`}
                    testID={`pay-bank-transfer-intro-row-${row.icon}-${index}`}
                  >
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
            <Box lx={{ flexDirection: "column", gap: "s16" }}>
              <Text
                typography="body3"
                lx={{ color: "muted", textAlign: "center" }}
                testID="pay-bank-transfer-intro-provided-by"
              >
                {providedBy}
              </Text>
              <Button
                appearance="base"
                size="lg"
                isFull
                onPress={handleCreateAccount}
                accessibilityLabel={createAccountLabel}
                testID="pay-bank-transfer-intro-create-account"
              >
                {createAccountLabel}
              </Button>
              <Button
                appearance="gray"
                size="lg"
                isFull
                onPress={handleLogIn}
                accessibilityLabel={logInLabel}
                testID="pay-bank-transfer-intro-log-in"
              >
                {logInLabel}
              </Button>
            </Box>
          </Box>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
