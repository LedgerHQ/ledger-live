import React from "react";
import { View, Pressable } from "react-native";
import {
  AddressInput,
  IconButton,
  NavBar,
  NavBarBackButton,
  NavBarContent,
  NavBarDescription,
  NavBarTitle,
  NavBarTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";

import { useSendHeaderViewModel } from "../hooks/useSendHeaderViewModel";

type SendHeaderProps = Readonly<{
  headerRight?: React.ReactNode;
}>;

export function SendHeader({ headerRight }: SendHeaderProps) {
  const viewModel = useSendHeaderViewModel();
  const styles = useStyleSheet(
    theme => ({
      addressInputContainer: {
        marginTop: theme.spacings.s8,
        paddingHorizontal: theme.spacings.s16,
        position: "relative" as const,
      },
      absoluteOverlay: {
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
    }),
    [],
  );

  return (
    <>
      <NavBar appearance="compact">
        {viewModel.canGoBack ? (
          <NavBarBackButton onPress={viewModel.handleBackPress} accessibilityLabel="Back" />
        ) : null}
        <NavBarContent>
          {viewModel.showTitle && viewModel.title ? (
            <NavBarTitle>{viewModel.title}</NavBarTitle>
          ) : null}
          {viewModel.descriptionText ? (
            <NavBarDescription>{viewModel.descriptionText}</NavBarDescription>
          ) : null}
        </NavBarContent>
        {viewModel.showHeaderRight && (
          <NavBarTrailing>
            {headerRight ?? (
              <IconButton
                appearance="no-background"
                size="md"
                icon={Close}
                accessibilityLabel="Close"
                onPress={viewModel.handleClose}
              />
            )}
          </NavBarTrailing>
        )}
      </NavBar>
      {viewModel.showRecipientInput ? (
        <View style={styles.addressInputContainer}>
          {viewModel.isRecipientStep ? (
            <AddressInput
              value={viewModel.recipientSearchValue}
              onChangeText={viewModel.setRecipientSearchValue}
              onClear={viewModel.clearRecipientSearch}
              onQrCodeClick={viewModel.handleQrCodeClick}
              placeholder={viewModel.recipientPlaceholder}
            />
          ) : (
            <>
              <AddressInput
                value={viewModel.formattedAddress}
                editable={false}
                hideClearButton
                placeholder={viewModel.recipientPlaceholder}
              />
              <Pressable
                style={styles.absoluteOverlay}
                accessibilityRole="button"
                accessibilityLabel="Edit recipient"
                onPress={viewModel.handleRecipientInputPress}
              />
            </>
          )}
        </View>
      ) : null}
    </>
  );
}
