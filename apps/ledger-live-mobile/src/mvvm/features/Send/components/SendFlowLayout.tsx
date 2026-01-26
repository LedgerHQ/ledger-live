import React, { useCallback, useMemo } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "~/context/Locale";
import { Text, InteractiveIcon, AddressInput } from "@ledgerhq/lumen-ui-rnative";
import { ArrowLeft } from "@ledgerhq/lumen-ui-rnative/symbols";

import { SEND_FLOW_CONFIG } from "../constants";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowData, useSendFlowActions } from "../context/SendFlowContext";
import { formatAddress } from "LLM/features/Accounts/utils/formatAddress";

type SendFlowLayoutProps = Readonly<{
  headerRight?: React.ReactNode;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
}>;

export function SendFlowLayout({ headerRight, headerContent, children }: SendFlowLayoutProps) {
  const navigation = useNavigation();
  const route = useRoute();
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
  const { t } = useTranslation();
  const { uiConfig, recipientSearchValue } = useSendFlowData();
  const { close, transaction, setRecipientSearchValue, clearRecipientSearch } =
    useSendFlowActions();
  const { state } = useSendFlowData();
  const currencyName = state.account.currency?.ticker ?? "";
  const title = t("send.newSendFlow.title", { currency: currencyName });

  const [currentStep, currentStepConfig] = useMemo<
    readonly [
      SendFlowStep | undefined,
      (typeof SEND_FLOW_CONFIG.stepConfigs)[SendFlowStep] | undefined,
    ]
  >(() => {
    const step = SEND_FLOW_CONFIG.stepOrder.find(
      step => SEND_FLOW_CONFIG.stepConfigs[step].screenName === route.name,
    );
    if (!step) return [undefined, undefined];
    return [step, SEND_FLOW_CONFIG.stepConfigs[step]];
  }, [route.name]);

  const canGoBack = Boolean(currentStepConfig?.canGoBack && navigation.canGoBack());
  const isRecipientStep = currentStep === SEND_FLOW_STEP.RECIPIENT;
  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;
  const showRecipientInput = Boolean(currentStepConfig?.addressInput);

  const handleBackPress = useCallback(() => {
    if (canGoBack) {
      if (currentStep === SEND_FLOW_STEP.AMOUNT) {
        transaction.updateTransaction(tx => ({
          ...tx,
          amount: new BigNumber(0),
          useAllAmount: false,
          feesStrategy: null,
        }));
      }
      navigation.goBack();
    } else {
      close();
    }
  }, [canGoBack, close, currentStep, navigation, transaction]);

  const formattedAddress = useMemo(
    () => formatAddress(recipientSearchValue),
    [recipientSearchValue],
  );

  const handleRecipientInputPress = useCallback(() => {
    if (!isAmountStep) return;
    navigation.goBack();
  }, [isAmountStep, navigation]);

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
                onQrCodeClick={() => {}}
                placeholder={
                  uiConfig.recipientSupportsDomain
                    ? t("send.newSendFlow.placeholder")
                    : t("send.newSendFlow.placeholderNoENS")
                }
              />
            ) : (
              <>
                <AddressInput
                  value={formattedAddress}
                  editable={false}
                  hideClearButton
                  placeholder={
                    uiConfig.recipientSupportsDomain
                      ? t("send.newSendFlow.placeholder")
                      : t("send.newSendFlow.placeholderNoENS")
                  }
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
