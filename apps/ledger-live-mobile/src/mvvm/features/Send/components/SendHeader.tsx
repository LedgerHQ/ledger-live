import React from "react";
import { View, Pressable } from "react-native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Text, InteractiveIcon, AddressInput } from "@ledgerhq/lumen-ui-rnative";
import { ArrowLeft, Close } from "@ledgerhq/lumen-ui-rnative/symbols";

import { useSendHeaderViewModel } from "../hooks/useSendHeaderViewModel";

type SendHeaderProps = Readonly<{
  headerRight?: React.ReactNode;
}>;

export function SendHeader({ headerRight }: SendHeaderProps) {
  const viewModel = useSendHeaderViewModel();
  const styles = useStyleSheet(
    theme => ({
      navbar: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: theme.spacings.s16,
        paddingHorizontal: theme.spacings.s16,
        paddingTop: 60,
        paddingBottom: theme.spacings.s8,
      },
      navbarLeft: {
        width: 40,
        alignItems: "flex-start" as const,
        flexShrink: 0,
      },
      navbarCenter: {
        flex: 1,
        minWidth: 0,
        alignItems: "center" as const,
        justifyContent: "center" as const,
      },
      navbarRight: {
        width: 40,
        alignItems: "flex-end" as const,
        flexShrink: 0,
      },
      headerSpacer: {
        width: 24,
        height: 24,
      },
      title: {
        textAlign: "center" as const,
      },
      description: {
        marginTop: theme.spacings.s4,
        textAlign: "center" as const,
      },
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
      <View style={styles.navbar}>
        <View style={styles.navbarLeft}>
          {viewModel.canGoBack ? (
            <InteractiveIcon
              iconType="stroked"
              onPress={viewModel.handleBackPress}
              accessibilityLabel="Back"
            >
              <ArrowLeft size={20} />
            </InteractiveIcon>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
        <View style={styles.navbarCenter}>
          {viewModel.showTitle && viewModel.title ? (
            <Text typography="heading2" style={styles.title} lx={{ color: "base" }}>
              {viewModel.title}
            </Text>
          ) : null}
          {viewModel.descriptionText ? (
            <Text typography="body2" style={styles.description} lx={{ color: "muted" }}>
              {viewModel.descriptionText}
            </Text>
          ) : null}
        </View>
        <View style={styles.navbarRight}>
          {headerRight ?? (
            <InteractiveIcon
              iconType="stroked"
              onPress={viewModel.handleClose}
              accessibilityLabel="Close"
            >
              <Close size={20} />
            </InteractiveIcon>
          )}
        </View>
      </View>
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
