import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Text, InteractiveIcon, AddressInput } from "@ledgerhq/lumen-ui-rnative";
import { ArrowLeft } from "@ledgerhq/lumen-ui-rnative/symbols";

import type { SendFlowLayoutProps } from "./types";
import type { SendFlowLayoutViewModel } from "./useSendFlowLayoutViewModel";

type SendFlowLayoutViewProps = SendFlowLayoutProps & SendFlowLayoutViewModel;

export function SendFlowLayoutView({
  headerRight,
  headerContent,
  children,
  title,
  canGoBack,
  isRecipientStep,
  showRecipientInput,
  recipientSearchValue,
  formattedAddress,
  recipientPlaceholder,
  handleBackPress,
  handleRecipientInputPress,
  setRecipientSearchValue,
  clearRecipientSearch,
  handleQrCodeClick,
}: SendFlowLayoutViewProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
      header: {
        paddingHorizontal: theme.spacings.s16,
        paddingTop: 60,
        paddingBottom: theme.spacings.s8,
      },
      headerRow: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
        marginBottom: theme.spacings.s16,
      },
      headerLeft: {
        width: 40,
        alignItems: "flex-start" as const,
      },
      headerRight: {
        width: 40,
        alignItems: "flex-end" as const,
      },
      headerSpacer: {
        width: 24,
        height: 24,
      },
      headerContent: {
        marginTop: theme.spacings.s12,
      },
      addressInputContainer: {
        marginTop: theme.spacings.s8,
        position: "relative" as const,
      },
      absoluteOverlay: {
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      bodyContent: {
        padding: theme.spacings.s16,
        flexGrow: 1,
      },
    }),
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {canGoBack ? (
              <InteractiveIcon
                iconType="stroked"
                onPress={handleBackPress}
                accessibilityLabel="Back"
              >
                <ArrowLeft size={20} />
              </InteractiveIcon>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
          <Text typography="heading2" lx={{ color: "base" }}>
            {title}
          </Text>
          <View style={styles.headerRight}>{headerRight}</View>
        </View>
        {showRecipientInput ? (
          <View style={styles.addressInputContainer}>
            {isRecipientStep ? (
              <AddressInput
                value={recipientSearchValue}
                onChangeText={setRecipientSearchValue}
                onClear={clearRecipientSearch}
                onQrCodeClick={handleQrCodeClick}
                placeholder={recipientPlaceholder}
              />
            ) : (
              <>
                <AddressInput
                  value={formattedAddress}
                  editable={false}
                  hideClearButton
                  placeholder={recipientPlaceholder}
                />
                <Pressable
                  style={styles.absoluteOverlay}
                  accessibilityRole="button"
                  accessibilityLabel="Edit recipient"
                  onPress={handleRecipientInputPress}
                />
              </>
            )}
          </View>
        ) : null}
        {headerContent ? <View style={styles.headerContent}>{headerContent}</View> : null}
      </View>
      <ScrollView contentContainerStyle={styles.bodyContent}>{children}</ScrollView>
    </View>
  );
}
