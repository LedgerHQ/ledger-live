import React, { useCallback, useEffect, useRef } from "react";
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
import type { BankTransferIntroViewProps } from "../../types";

export function BankTransferIntroView({
  isOpen,
  title,
  description,
  createAccountLabel,
  logInLabel,
  providedBy,
  rows,
  bottomInset,
  onShown,
  onCreateAccountPress,
  onLogInPress,
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

  return (
    <BottomSheetView
      style={{ paddingHorizontal: 0, paddingBottom: bottomInset + 24 }}
      testID="pay-bank-transfer-intro-content"
    >
      {isOpen ? (
        <>
          <BottomSheetHeader density="expanded" />
          <Box lx={{ paddingBottom: "s24", gap: "s16" }}>
            <Box lx={{ flexDirection: "column", gap: "s8" }}>
              <Text typography="heading3SemiBold" lx={{ color: "base" }}>
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
        </>
      ) : null}
    </BottomSheetView>
  );
}
